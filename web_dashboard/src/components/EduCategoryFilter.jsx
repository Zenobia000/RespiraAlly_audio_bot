import React from "react";

// 類別過濾（單行可橫向滾動）
export default function EduCategoryFilter({
  categories,
  active,
  onToggle,
  onClear,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        overflowX: "auto",
        whiteSpace: "nowrap",
      }}
    >
      <button
        className="btn"
        onClick={onClear}
        style={{ background: active.size === 0 ? "#6366f1" : undefined }}
      >
        全部
      </button>
      {categories.map((c) => {
        const selected = active.has(c);
        return (
          <button
            key={c}
            className="btn"
            onClick={() => onToggle(c)}
            style={{ background: selected ? "#6366f1" : undefined }}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
