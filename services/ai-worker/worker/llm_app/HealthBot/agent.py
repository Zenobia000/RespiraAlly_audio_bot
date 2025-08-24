import hashlib
import json
import os
import time
from typing import Any, Dict, List

from crewai import LLM, Agent
from openai import OpenAI

# ---- 專案模組（注意相對匯入）----
from ..embedding import safe_to_vector
from ..toolkits.memory_store import retrieve_memory_pack_v3, upsert_atoms_and_surfaces

# redis 與工具：注意 summarize_chunk_and_commit 來自 tools.py
from ..toolkits.redis_store import (
    fetch_all_history,
    get_summary,
    peek_remaining,
    purge_user_session,
    set_state_if,
)
from ..toolkits.tools import (
    AlertCaseManagerTool,
    ModelGuardrailTool,
    SearchMilvusTool,
    summarize_chunk_and_commit,
)

OPENAI_MODEL = os.getenv("MODEL_NAME", "gpt-4o-mini")
EMBED_DIM = int(os.getenv("EMBED_DIM", 1536))

granddaughter_llm = LLM(
    model=os.getenv("MODEL_NAME", "gpt-4o-mini"),
    temperature=0.5,
)

guard_llm = LLM(
    model=os.getenv("MODEL_NAME", "gpt-4o-mini"),
    temperature=0,
)


# ========= 小工具 =========
def _now_ms() -> int:
    return int(time.time() * 1000)


def _stable_group_key(display_text: str) -> str:
    # 以展示文本（atom 的可讀敘述）為基準做 hash，確保 atom/surface 用同一把 gk
    h = hashlib.sha1(display_text.lower().encode("utf-8")).hexdigest()[:32]
    return "auto:" + h


def _render_session_transcript(user_id: str, k: int = 9999) -> str:
    rounds = fetch_all_history(user_id) or []
    out = []
    for i, r in enumerate(rounds[-k:], 1):
        q = (r.get("input") or "").strip()
        a = (r.get("output") or "").strip()
        out.append(f"{i:02d}. 使用者：{q}")
        out.append(f"    助手：{a}")
    return "\n".join(out)


# ========= Finalize：記憶蒸餾 =========
_DISTILL_SYS = """
你是「記憶蒸餾器」。請從本輪對話中，只抽取『可長期重用的既定事實』，並為每一項指定保存期限（TTL）。
抽取規則（務必遵守）：
- 只收：過敏史、固定偏好、醫囑/用藥（現行）、固定行程/提醒、聯絡人、慢性病史、長期限制/禁忌。
- 不收：寒暄、一次性事件、短期症狀、猜測、模型意見。
- 每項提供 60–160 字可讀敘述（display_text），不得添加未出現的推測。
- 每項附 1–3 句【evidence 原話】（逐字引用使用者或助手話語），之後將以此做向量檢索。
- TTL 規則：
  allergy/慢性病/聯絡人：ttl_days=0（永久）
  醫囑/用藥：ttl_days=180
  固定偏好：ttl_days=365
  固定行程/提醒：ttl_days=90
  其他長期限制/禁忌：ttl_days=365
- 若無符合，輸出空陣列 []。
輸出 JSON 陣列，元素格式：
{
  "type": "allergy|preference|doctor_order|schedule|reminder|contact|condition|constraint|note",
  "display_text": "<60-160字可讀敘述>",
  "evidence": ["<原話1>", "<原話2>"],  // 最多3句
  "ttl_days": 0|90|180|365
}
""".strip()


def _distill_facts(user_id: str) -> List[Dict[str, Any]]:
    transcript = _render_session_transcript(user_id)
    if not transcript.strip():
        return []
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    res = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.2,
        max_tokens=900,
        messages=[
            {"role": "system", "content": _DISTILL_SYS},
            {
                "role": "user",
                "content": f"使用者本輪對話如下（逐字）：\n<<<\n{transcript}\n>>>",
            },
        ],
    )
    raw = (res.choices[0].message.content or "").strip()
    # 清掉 ```json 區塊符號
    if raw.startswith("```"):
        lines = [ln for ln in raw.splitlines() if not ln.strip().startswith("```")]
        raw = "\n".join(lines).strip()
    lb, rb = raw.find("["), raw.rfind("]")
    if lb == -1 or rb == -1 or rb <= lb:
        return []
    try:
        arr = json.loads(raw[lb : rb + 1])
        return arr if isinstance(arr, list) else [arr]
    except Exception:
        return []


def _ttl_days_to_expire_at(ttl_days: int) -> int:
    if not ttl_days or int(ttl_days) == 0:
        return 0
    return _now_ms() + int(ttl_days) * 86400 * 1000


def finalize_session(user_id: str) -> None:
    """
    會話收尾：
    1) （可選）補摘要（純為降本，不影響 LTM）
    2) LLM 蒸餾 → 既定事實 + evidence(原話) + ttl_days
    3) 寫入 Milvus：
       - atom：text=display_text；embedding=0 向量；expire_at=由 ttl_days 決定
       - surface：text=原話；embedding=E(原話)；expire_at 同上
    4) 清理 Redis session
    """
    # 1) 摘要（可註解掉）
    try:
        set_state_if(user_id, expect="ACTIVE", to="FINALIZING")
        start, remaining = peek_remaining(user_id)
        if remaining:
            summarize_chunk_and_commit(
                user_id, start_round=start, history_chunk=remaining
            )
    except Exception as e:
        print(f"[finalize summary warn] {e}")

    # 2) 記憶蒸餾
    facts = _distill_facts(user_id)

    # 3) 入庫
    to_upsert = []
    session_id = f"sess:{int(time.time())}"
    for f in facts:
        display = (f.get("display_text") or "").strip()
        if not display:
            continue
        ttl_days = int(f.get("ttl_days", 365))
        expire_at = _ttl_days_to_expire_at(ttl_days)
        gk = _stable_group_key(display)  # ★ 產生穩定 group_key

        # atom（展示用）
        to_upsert.append(
            {
                "type": "atom",
                "group_key": gk,
                "text": display[:4000],
                "importance": (
                    4
                    if f.get("type")
                    in ("allergy", "doctor_order", "contact", "condition")
                    else 3
                ),
                "confidence": 0.9,
                "times_seen": 1,
                "status": "active",
                "source_session_id": session_id,
                "expire_at": expire_at,
                "embedding": [0.0] * EMBED_DIM,  # 占位，不參與檢索
            }
        )

        # surfaces（檢索主力）：對 evidence 原句做 embedding
        for ev in (f.get("evidence") or [])[:3]:
            ev_txt = (ev or "").strip()
            if not ev_txt:
                continue
            vec = safe_to_vector(ev_txt) or []
            if not vec:
                continue
            to_upsert.append(
                {
                    "type": "surface",
                    "group_key": gk,
                    "text": ev_txt[:4000],
                    "importance": 2,
                    "confidence": 0.95,
                    "times_seen": 1,
                    "status": "active",
                    "source_session_id": session_id,
                    "expire_at": expire_at,
                    "embedding": vec,
                }
            )

    if to_upsert:
        try:
            upsert_atoms_and_surfaces(user_id, to_upsert)
            print(f"✅ finalize：已寫入長期記憶 {len(to_upsert)} 筆（atom/surface）")
        except Exception as e:
            print(f"[finalize upsert error] {e}")
    else:
        print("ℹ️ finalize：本輪沒有可長期保存的事實")

    # 4) 清理 session
    try:
        purge_user_session(user_id)
    except Exception as e:
        print(f"[finalize purge warn] {e}")


# ========= 檢索接點 =========
def build_prompt_from_redis(user_id: str, k: int = 6, current_input: str = "") -> str:
    parts: List[str] = []

    # (1) 長期記憶（原話導向）
    if current_input:
        qv = safe_to_vector(current_input)
        if qv:
            try:
                mem_pack = retrieve_memory_pack_v3(
                    user_id=user_id,
                    query_vec=qv,
                    topk_groups=5,
                    sim_thr=0.5,
                    tau_days=45,
                    include_raw_qa=False,
                )
                if mem_pack:
                    parts.append(mem_pack)
            except Exception as e:
                print(f"[memory v3 retrieval warn] {e}")

    # (2) 歷史摘要（可選）
    try:
        summary_text, _ = get_summary(user_id)
        if summary_text:
            parts.append("📌 歷史摘要：\n" + summary_text.strip())
    except Exception:
        pass

    # (3) 近期未摘要片段（可選）
    try:
        rounds = fetch_all_history(user_id) or []
        tail = rounds[-k:]
        if tail:
            lines = []
            for r in tail:
                q = (r.get("input") or "").strip()
                a = (r.get("output") or "").strip()
                lines.append(f"使用者：{q}")
                lines.append(f"助手：{a}")
            parts.append("🕓 近期對話（未摘要）：\n" + "\n".join(lines))
    except Exception:
        pass

    return "\n\n".join([p for p in parts if p.strip()]) or ""


# ========= CrewAI 代理工廠（供 chat_pipeline 匯入）=========
def create_guardrail_agent() -> Agent:
    return Agent(
        role="Guardrail",
        goal="判斷是否需要攔截使用者輸入（安全/法律/醫療等高風險）",
        backstory="嚴謹的安全審查器",
        tools=[ModelGuardrailTool()],
        verbose=False,
        allow_delegation=False,
        llm=guard_llm,
        memory=False,
    )


def create_health_companion(user_id: str) -> Agent:
    return Agent(
        role="National Granddaughter Ally",
        goal="溫暖陪伴並給一行回覆；工具僅在符合當輪規則時使用，避免不必要的查詢與通報。",
        backstory=f"陪伴使用者 {user_id} 的溫暖孫女",
        tools=[
            SearchMilvusTool(),
            AlertCaseManagerTool(),
        ],  # 緊急時會被任務 prompt 要求觸發
        verbose=False,
        allow_delegation=False,
        llm=granddaughter_llm,
        memory=False,
        max_iterations=1,
    )
    
