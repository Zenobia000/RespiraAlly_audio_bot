import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { genPatients } from "../utils/mock";

function RiskChip({ risk }) {
  const color =
    risk === "高" ? "#fee2e2" : risk === "低" ? "#dcfce7" : "#eef2ff";
  const fg = risk === "高" ? "#b91c1c" : risk === "低" ? "#166534" : "#3730a3";
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        background: color,
        color: fg,
        fontSize: 12,
      }}
    >
      {risk}
    </span>
  );
}

export default function PatientListPane() {
  const [query, setQuery] = useState("");
  const patients = useMemo(() => genPatients(24), []);
  const filtered = patients.filter((p) => (p.name + p.id).includes(query));
  const nav = useNavigate();

  return (
    <div className="card" aria-label="病患列表">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>病患列表</div>
        <input
          style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }}
          placeholder="搜尋姓名或編號…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          maxHeight: 560,
          overflow: "auto",
        }}
      >
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => nav(`/cases/${p.id}`)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 12,
              background: "#fff",
              border: "1px solid #eef2ff",
              cursor: "pointer",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {p.name}{" "}
                <span style={{ fontSize: 12, color: "#6b7280" }}>#{p.id}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {p.sex} · {p.age} 歲 · 近7天依從 {p.adherence7d}%
              </div>
            </div>
            <RiskChip risk={p.risk} />
          </button>
        ))}
      </div>
    </div>
  );
}
