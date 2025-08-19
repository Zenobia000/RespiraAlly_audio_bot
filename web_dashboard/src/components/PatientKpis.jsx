import React from "react";

export default function PatientKpis({
  adherence7d,
  adherenceLabel = "近 7 天依從",
  lastReportDay,
  lastMedication,
}) {
  return (
    <div
      className="card"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
      }}
    >
      <div>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>
          {adherenceLabel}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{adherence7d}%</div>
      </div>
      <div>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>最新回報日期</div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{lastReportDay}</div>
      </div>
      <div>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>今日是否吸藥</div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>
          {lastMedication ? "是" : "否"}
        </div>
      </div>
    </div>
  );
}
