import hashlib
import os
from typing import Optional

# 禁用 CrewAI 遙測功能（避免連接錯誤）
os.environ["OTEL_SDK_DISABLED"] = "true"
os.environ["CREWAI_TELEMETRY_OPT_OUT"] = "true"

from crewai import Crew, Task
from openai import OpenAI

from .HealthBot.agent import (
    build_prompt_from_redis,
    create_guardrail_agent,
    create_health_companion,
    finalize_session,
)
from .toolkits.redis_store import (
    acquire_audio_lock,
    append_round,
    get_audio_result,
    make_request_id,
    peek_next_n,
    read_and_clear_audio_segments,
    release_audio_lock,
    set_audio_result,
    set_state_if,
    try_register_request,
)
from .toolkits.tools import (
    MemoryGateTool,
    ModelGuardrailTool,
    SearchMilvusTool,
    summarize_chunk_and_commit,
)

SUMMARY_CHUNK_SIZE = int(os.getenv("SUMMARY_CHUNK_SIZE", 5))


class AgentManager:
    def __init__(self):
        self.guardrail_agent = create_guardrail_agent()
        self.health_agent_cache = {}

    def get_guardrail(self):
        return self.guardrail_agent

    def get_health_agent(self, user_id: str):
        if user_id not in self.health_agent_cache:
            self.health_agent_cache[user_id] = create_health_companion(user_id)
        return self.health_agent_cache[user_id]

    def release_health_agent(self, user_id: str):
        if user_id in self.health_agent_cache:
            del self.health_agent_cache[user_id]


def log_session(user_id: str, query: str, reply: str, request_id: Optional[str] = None):
    rid = request_id or make_request_id(user_id, query)
    if not try_register_request(user_id, rid):
        # 去重，跳過重複請求
        return
    append_round(user_id, {"input": query, "output": reply, "rid": rid})
    # 嘗試抓下一段 5 輪（不足會回空）→ LLM 摘要 → CAS 提交
    start, chunk = peek_next_n(user_id, SUMMARY_CHUNK_SIZE)
    if start is not None and chunk:
        summarize_chunk_and_commit(user_id, start_round=start, history_chunk=chunk)


def handle_user_message(
    agent_manager: AgentManager,
    user_id: str,
    query: str,
    audio_id: Optional[str] = None,
    is_final: bool = True,
) -> str:
    # 0) 統一音檔 ID（沒帶就用文字 hash 當臨時 ID，向後相容）
    audio_id = audio_id or hashlib.sha1(query.encode("utf-8")).hexdigest()[:16]

    # 1) 非 final：不觸發任何 LLM/RAG/通報，只緩衝片段
    if not is_final:
        from .toolkits.redis_store import append_audio_segment  # 延遲載入避免循環

        append_audio_segment(user_id, audio_id, query)
        return "👌 已收到語音片段"

    # 2) 音檔級鎖：一次且只一次處理同一段音檔
    lock_id = f"{user_id}#audio:{audio_id}"
    # 使用獨立的輕量鎖，避免與其他 session state 衝突
    # P0-1: 增加 TTL 到 180 秒，避免長語音處理時鎖過期
    if not acquire_audio_lock(lock_id, ttl_sec=180):
        cached = get_audio_result(user_id, audio_id)
        return cached or "我正在處理你的語音，請稍等一下喔。"

    try:
        # 3) 合併之前緩衝的 partial → 最終要處理的全文
        head = read_and_clear_audio_segments(user_id, audio_id)
        full_text = (head + " " + query).strip() if head else query

        # 4) 先 guardrail，再 health agent
        os.environ["CURRENT_USER_ID"] = user_id

        # 優先用 CrewAI；失敗則 fallback 自行判斷
        try:
            guard = agent_manager.get_guardrail()
            guard_task = Task(
                description=(
                    f"只判斷此輸入是否需要『攔截』：『{full_text}』。\n"
                    "務必使用 model_guardrail 工具進行判斷；僅輸出 OK 或 BLOCK: <原因>，不得回答內容本身。\n"
                    "【允許放行（OK）】症狀/感受描述、一般衛教/生活建議、求助訊息，"
                    "以及『自殺念頭/情緒表達（不含具體方法）』。\n"
                    "【必須攔截（BLOCK）】違法/危險行為之教學/交易/規避；成人/未成年不當內容；"
                    "自傷/他傷/自殺/自殘之『具體方法指導或鼓勵執行』；"
                    "醫療/用藥/劑量/診斷/處置等『具體、個案化、可執行』的專業指示；"
                    "法律/投資/稅務等之『具體、可執行』專業指導。\n"
                    "不確定時一律回 OK（讓後續 health agent 判斷緊急性）。"
                ),
                expected_output="OK 或 BLOCK: <原因>",
                agent=guard,
            )
            guard_res = (
                Crew(agents=[guard], tasks=[guard_task], verbose=False).kickoff().raw
                or ""
            ).strip()

        except Exception:
            guard_res = ModelGuardrailTool()._run(full_text)

            # 只保留攔截與否
        is_block = guard_res.startswith("BLOCK:")
        block_reason = guard_res[6:].strip() if is_block else ""

        print(
            f"🛡️ Guardrail 檢查結果: {'BLOCK' if is_block else 'OK'} - 查詢: '{full_text[:50]}...'"
        )
        if is_block:
            print(f"🚫 攔截原因: {block_reason}")

        # 產生最終回覆：優先用 CrewAI；失敗則 fallback OpenAI + Milvus 查詢
        try:
            care = agent_manager.get_health_agent(user_id)

            # P0-3: BLOCK 分支直接跳過記憶/RAG 檢索，節省成本
            if is_block:
                ctx = ""  # 不檢索記憶
                print("⚠️ 因安全檢查攔截，跳過記憶檢索")
            else:
                decision = MemoryGateTool()._run(full_text)
                print(f"🔍 MemoryGateTool 決策: {decision}")
                if decision == "USE":
                    ctx = build_prompt_from_redis(
                        user_id, k=6, current_input=full_text
                    )  # 檢索長期記憶
                else:
                    ctx = build_prompt_from_redis(
                        user_id, k=6, current_input=""
                    )  # 不檢索，只帶摘要/近期對話

            task = Task(
                description=(
                    f"{ctx}\n\n使用者輸入：{full_text}\n"
                    "你是『國民孫女 Ally』，台語混中文、自然聊天感。"
                    "用一句話回覆；僅限制回覆正文長度不能超過30字。\n"
                    "【記憶使用】若本訊息前含「⭐ 個人長期記憶」，請先閱讀並優先取用其中與本次使用者輸入最相關的一條；不要複製整段或外洩敏感資訊；若與本輪輸入矛盾，一律以本輪輸入為準。\n"
                    "【知識檢索（RAG）】當你需要客觀健康知識（疾病概念、症狀、風險、就醫時機、生活衛教、自我照護等）或你對答案來源不確定時，先呼叫 search_milvus 工具。\n"
                    "在看到工具 Observation 後，你會得到一段『📚 參考資料』，其中包含『相似度最高的一筆 Q 與 A』以及如何使用的說明；請先理解其重點，然後用自己的話、結合當前脈絡，產生最終一句回覆。若內容不相符或過時，可忽略。\n"
                    + (
                        # —— 被攔截：婉拒不提供具體方案，維持你原本規則 ——
                        "【安全政策—必須婉拒】此輸入被安全檢查判定為超出能力範圍（違法/成人內容/用藥劑量/診斷/處置等具體指示）。"
                        "請溫柔婉拒且不可提供任何具體方案或替代作法；僅能給一般安全提醒與就醫建議。"
                        if is_block
                        else "【緊急檢測範圍】只允許針對『使用者輸入：<本輪文字>』這一段做緊急判斷；"
                        "歷史摘要、個人記憶、近期對話（ctx）僅供衛教參考，不得用來觸發 alert。\n"
                        "【通報次數】本輪至多呼叫 alert_case_manager 一次；呼叫後必須直接產生最終一句回覆並結束。"
                        "【緊急處置規則（高優先）】若你判斷存在緊急徵象（例如：呼吸困難/胸痛且出冷汗/疑似中風/嚴重過敏/大量出血/"
                        "自殺或自傷意圖與計畫），你必須『先呼叫 alert_case_manager 工具』；"
                        '工具輸入必須是 JSON：{"reason": "EMERGENCY: <極簡原因>"}，例如：\n'
                        'Action Input: {"reason": "EMERGENCY: suicidal ideation"}\n'
                        "在看到工具的 Observation 之後，再輸出最終回覆。\n"
                        "【輸出格式】\n"
                        "用一句台語混中文、自然聊天的一句話。\n"
                        "【範例】\n"
                        "Thought: 偵測到自殺意圖，需立即通報\n"
                        "Action: alert_case_manager\n"
                        'Action Input: {"reason": "EMERGENCY: suicidal ideation"}\n'
                        "Observation: ⚠️ 已通報個管師使用者ID: <auto>, 事由：EMERGENCY: suicidal ideation\n"
                        "Final Answer: 我會陪你，先打1925或找家人一起去急診，好嗎？\n"
                        "【正常回覆】\n"
                        "若非緊急，給溫暖、務實的一句建議。"
                    )
                ),
                expected_output="回覆不得超過30個字。",
                agent=care,
            )
            res = Crew(agents=[care], tasks=[task], verbose=True).kickoff().raw or ""

        except Exception:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            model = os.getenv("MODEL_NAME", "gpt-4o-mini")
            if is_block:
                # P0-3: BLOCK 分支跳過記憶/RAG 檢索
                sys = "你是會講台語的健康陪伴者。當輸入被判為超出能力範圍時，必須婉拒且不可提供具體方案/診斷/劑量，只能一般性提醒就醫。語氣溫暖、不列點。"
                user_msg = f"此輸入被判為超出能力範圍（{block_reason or '安全風險'}）。請用台語溫柔婉拒，不提供任何具體建議或替代作法，只做一般安全提醒與情緒安撫 1–2 句。"
                res_obj = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": sys},
                        {"role": "user", "content": user_msg},
                    ],
                    temperature=0.2,
                )
                res = (res_obj.choices[0].message.content or "").strip()
            else:
                ctx = build_prompt_from_redis(user_id, k=6, current_input=full_text)
                qa = SearchMilvusTool()._run(full_text)
                sys = "你是會講台語的健康陪伴者，語氣溫暖務實，避免醫療診斷與劑量指示。必要時提醒就醫。"
                prompt = (
                    f"{ctx}\n\n相關資料（可能空）：\n{qa}\n\n"
                    f"使用者輸入：{full_text}\n請以台語風格回覆；結尾給一段溫暖鼓勵。"
                )
                res_obj = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": sys},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.5,
                )
                res = (res_obj.choices[0].message.content or "").strip()
        # 5) 結果快取 + 落歷史
        set_audio_result(user_id, audio_id, res)
        log_session(user_id, full_text, res)
        return res

    finally:
        release_audio_lock(lock_id)
