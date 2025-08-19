import React from "react";
import { useNavigate } from "react-router-dom";
import { formatLastReportDays } from "../utils/mock";

export default function PatientGroupList({ title, patients }) {
  const nav = useNavigate();
  return (
    <div className="card" aria-label={title}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>{title}</div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: 300,
          overflow: "auto",
        }}
      >
        {patients.map((p) => (
          <button
            key={p.id}
            onClick={() => nav(`/cases/${p.id}`)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #eef2ff",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {p.name.at(0)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {p.name}{" "}
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    #{p.id}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  依從 7d：{p.adherence7d}%｜
                  {formatLastReportDays(p.lastReportDays)}
                </div>
              </div>
            </div>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                background: "#fff7ed",
                color: "#9a3412",
                fontSize: 12,
              }}
            >
              查看
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
