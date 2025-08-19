import React from "react";

export default function EvaluationSuggestions({ metrics }) {
  const avgWater = Math.round(
    metrics.reduce((a, b) => a + b.water_cc, 0) / metrics.length
  );
  const medBreaks14 = metrics.slice(-14).filter((m) => !m.medication).length;
  const exerciseDays = metrics.filter((m) => m.exercise_min >= 20).length;
  return (
    <div className="card" aria-label="智慧建議">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>智慧建議（模擬）</div>
      <ul style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8 }}>
        <li>
          過去 7 天「喝水」中位數{" "}
          <b style={{ color: "#111827" }}>{avgWater}cc</b>，建議持續維持
          1500–2000cc。
        </li>
        <li>
          近 2 週 <b style={{ color: "#111827" }}>吸藥中斷 {medBreaks14} 天</b>
          ，可設置用藥提醒。
        </li>
        <li>
          近 30 天{" "}
          <b style={{ color: "#111827" }}>運動日 {exerciseDays} / 30</b>，可嘗試
          10 分鐘分段走。
        </li>
      </ul>
    </div>
  );
}
