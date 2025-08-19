import React from "react";

export default function TimeRangeTabs({ value, onChange, items: propItems }) {
  const items = propItems ?? [
    { key: "day", label: "天" },
    { key: "week", label: "週" },
    { key: "month", label: "月" },
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 6,
        background: "#eef2ff",
        padding: 4,
        borderRadius: 999,
      }}
    >
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: 0,
            cursor: "pointer",
            fontWeight: 600,
            background: value === it.key ? "#2563eb" : "transparent",
            color: value === it.key ? "#fff" : "#1e40af",
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
