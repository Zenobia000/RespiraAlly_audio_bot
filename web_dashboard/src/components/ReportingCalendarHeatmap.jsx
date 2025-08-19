import React, { useMemo } from "react";
import { genReportingCalendarData } from "../utils/mock";

export default function ReportingCalendarHeatmap() {
  const data = useMemo(() => genReportingCalendarData(8), []); // 8 週
  const max = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);

  const weeks = [];
  for (let w = 0; w < data.length / 7; w += 1) {
    weeks.push(data.slice(w * 7, (w + 1) * 7));
  }

  const colorOf = (v) => {
    const t = v / max; // 0~1
    const a = 0.2 + t * 0.8;
    return `rgba(37, 99, 235, ${a.toFixed(2)})`;
  };

  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        回報熱力曆（近 8 週）
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${weeks.length}, 14px)`,
          gap: 4,
        }}
        aria-label="熱力圖"
      >
        {weeks.map((week, wi) => (
          <div
            key={wi}
            style={{
              display: "grid",
              gridTemplateRows: "repeat(7, 14px)",
              gap: 4,
            }}
          >
            {week.map((d, di) => (
              <div
                key={di}
                title={`${d.date}: ${d.count}`}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: colorOf(d.count),
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
