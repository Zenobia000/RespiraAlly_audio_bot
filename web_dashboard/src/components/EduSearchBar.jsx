import React from "react";

export default function EduSearchBar({
  value,
  onChange,
  placeholder = "搜尋問題、回答或關鍵詞…（支援模糊）",
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: 10,
          borderRadius: 10,
          border: "1px solid #e5e7eb",
        }}
      />
      {value ? (
        <button
          className="btn"
          onClick={() => onChange("")}
          style={{ background: "#e5e7eb" }}
        >
          清除
        </button>
      ) : null}
    </div>
  );
}
