import React from "react";

export default function Header({ title }) {
  return (
    <header className="header" aria-label="頁首">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 40px",
          fontSize: "18px",
        }}
      >
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn">匯出</button>
        </div>
      </div>
    </header>
  );
}
