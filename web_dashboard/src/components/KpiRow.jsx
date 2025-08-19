import React from "react";

export default function KpiRow({ items }) {
  return (
    <div className="kpi">
      {items.map((k) => (
        <div key={k.label} className="card" style={{ padding: 14 }}>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>{k.label}</div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: k.color || "inherit",
            }}
          >
            {k.value}
          </div>
        </div>
      ))}
    </div>
  );
}
