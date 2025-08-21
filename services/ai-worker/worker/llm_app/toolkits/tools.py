import os
from typing import List

from crewai.tools import BaseTool
from openai import OpenAI
from pydantic import BaseModel, Field
from pymilvus import Collection, connections

from ..embedding import to_vector
from .redis_store import commit_summary_chunk, xadd_alert

_milvus_loaded = False
_collection = None


class SearchMilvusTool(BaseTool):
    name: str = "search_milvus"
    description: str = "在 Milvus 中搜尋 COPD 相關問答，回傳相似問題與答案"

    def _run(self, query: str) -> str:
        global _milvus_loaded, _collection
        try:
            if not _milvus_loaded:
                try:
                    connections.get_connection("default")
                except Exception:
                    connections.connect(
                        alias="default",
                        uri=os.getenv("MILVUS_URI", "http://localhost:19530"),
                    )
                _collection = Collection("copd_qa")
                _collection.load()
                _milvus_loaded = True
            thr = float(os.getenv("SIMILARITY_THRESHOLD", 0.7))
            vec = to_vector(query)
            if not isinstance(vec, list):
                vec = vec.tolist() if hasattr(vec, "tolist") else list(vec)
            res = _collection.search(
                data=[vec],
                anns_field="embedding",
                param={"metric_type": "COSINE", "params": {"nprobe": 10}},
                limit=5,
                output_fields=["question", "answer", "category"],
            )
            out: List[str] = []
            for hit in res[0]:
                if hit.score >= thr:
                    q = hit.entity.get("question")
                    a = hit.entity.get("answer")
                    cat = hit.entity.get("category")
                    out.append(f"[{cat}] (相似度: {hit.score:.3f})\nQ: {q}\nA: {a}")
            return "\n\n".join(out) if out else "[查無高相似度結果]"
        except Exception as e:
            return f"[Milvus 錯誤] {e}"


def summarize_chunk_and_commit(
    user_id: str, start_round: int, history_chunk: list
) -> bool:
    if not history_chunk:
        return True
    text = "".join(
        [
            f"第{start_round + i + 1}輪:\n長輩: {h['input']}\n金孫: {h['output']}\n\n"
            for i, h in enumerate(history_chunk)
        ]
    )
    prompt = f"請將下列對話做 80-120 字摘要，聚焦：健康問題、情緒、生活要點。\n\n{text}"
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        res = client.chat.completions.create(
            model=os.getenv("MODEL_NAME", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "你是專業的對話摘要助手。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        body = (res.choices[0].message.content or "").strip()
        header = f"--- 第{start_round + 1}至{start_round + len(history_chunk)}輪對話摘要 ---\n"
        return commit_summary_chunk(
            user_id,
            expected_cursor=start_round,
            advance=len(history_chunk),
            add_text=header + body,
        )
    except Exception as e:
        print(f"[摘要錯誤] {e}")
        return False


class AlertCaseManagerToolSchema(BaseModel):
    reason: str = Field(
        ...,
        description="一行原因字串，需以 'EMERGENCY:' 開頭，例如：'EMERGENCY: suicidal ideation'",
    )


class AlertCaseManagerTool(BaseTool):
    name: str = "alert_case_manager"
    description: str = (
        "偵測到緊急健康/心理風險時，立即通報個管師。"
        "【用法】以 JSON 傳入 {'reason': 'EMERGENCY: <極簡原因>'}；"
        "用戶ID由系統自動填入，無需提供。"
    )
    args_schema = AlertCaseManagerToolSchema  # ★ 關鍵：明確宣告參數鍵

    def _run(self, reason: str) -> str:
        try:
            uid = self.runtime_context.get("user_id") or os.getenv("CURRENT_USER_ID")
            import datetime

            ts = datetime.datetime.now().isoformat(timespec="seconds")
            print(
                f"[{ts}] 🚨 AlertCaseManagerTool triggered: user={uid}, reason={reason}"
            )
            from .redis_store import xadd_alert

            xadd_alert(uid, reason)
            return f"⚠️ 已通報個管師使用者ID: {uid}，事由：{reason}"
        except Exception as e:
            return f"[Alert 送出失敗] {e}"


class ModelGuardrailTool(BaseTool):
    name: str = "model_guardrail"
    description: str = (
        "完全由 LLM 安全審查：判斷是否違法/危險/自傷，或屬於需專業人士的具體指示（如用藥/劑量/診斷/處置）。只輸出 OK 或 BLOCK: <原因>。"
    )

    def _run(self, text: str) -> str:
        try:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            guard_model = os.getenv(
                "GUARD_MODEL", os.getenv("MODEL_NAME", "gpt-4o-mini")
            )
            sys = (
                "你是安全審查器，需精準判斷是否必須攔截。\n"
                "【允許（回 OK）】以下情況一律放行：\n"
                "- 症狀敘述或一般健康資訊的詢問（例如：症狀、成因、風險因子、何時就醫的提醒）。\n"
                "- 一般生活保健/衛教/注意事項等非個案化、非指令性的建議。\n"
                "- 情緒低落、自殺念頭或求助的表達（不含具體方法）。\n"
                "【必須攔截（回 BLOCK: <原因>）】符合任一條件：\n"
                "1) 違法/危險行為的教學、買賣、製作或規避（毒品、武器、暴力、駭客、爆裂物等）。\n"
                "2) 自傷/他傷/自殺/自殘的『具體方法指導或鼓勵執行』。\n"
                "3) 成人性內容或未成年相關不當內容的請求。\n"
                "4) 醫療/用藥/劑量/診斷/處置等『具體、個案化、可執行』的專業指示或方案。\n"
                "5) 法律、投資、稅務等高風險領域之『具體、可執行』的專業指導。\n"
                "【判斷原則】僅在請求明確落入上述攔截條件時才 BLOCK；\n"
                "若是描述狀況或尋求一般性說明/保健建議，請回 OK。\n"
                "若不確定，預設回 OK。\n"
                "【輸出格式】只能是：\n"
                "OK\n"
                "或\n"
                "BLOCK: <極簡原因>\n"
            )

            user = f"使用者輸入：{text}\n請依規則只輸出 OK 或 BLOCK: <原因>。"
            res = client.chat.completions.create(
                model=guard_model,
                messages=[
                    {"role": "system", "content": sys},
                    {"role": "user", "content": user},
                ],
                temperature=0,
                max_tokens=24,
            )
            out = (res.choices[0].message.content or "").strip()
            # 預設寬鬆通過：若非明確 BLOCK，一律視為 OK
            if not out.startswith("BLOCK:"):
                return "OK"
            # 僅保留精簡 BLOCK 理由
            if len(out) > 256:
                out = out[:256]
            return out
        except Exception as e:
            # Guardrail 故障時，不要阻擋主流程
            print(f"[guardrail_error] {e}")
            return "OK"
