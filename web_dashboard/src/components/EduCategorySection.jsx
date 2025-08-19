import React from "react";
import EduItemCard from "./EduItemCard";

export default function EduCategorySection({
  category,
  items,
  onUpdateItem,
  onDeleteItem,
}) {
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>{category}</div>
        <span className="badge">{items.length} 篇</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <EduItemCard
            key={`${category}-${i}`}
            item={it}
            onUpdate={(patch) => onUpdateItem(it, patch)}
            onDelete={() => onDeleteItem(it)}
          />
        ))}
      </div>
    </div>
  );
}
