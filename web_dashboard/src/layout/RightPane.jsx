import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { genPatients, formatLastReportDays } from "../utils/mock";

function Chip({ children, color }) {
  const bg =
    color === "red" ? "#fee2e2" : color === "green" ? "#dcfce7" : "#eef2ff";
  const fg =
    color === "red" ? "#b91c1c" : color === "green" ? "#166534" : "#3730a3";
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: 12,
      }}
    >
      {children}
    </span>
  );
}

export default function RightPane({ alerts, style }) {
  const nav = useNavigate();
  const allPatients = useMemo(() => genPatients(60), []);
  const [q, setQ] = useState("");
  const suggestions = useMemo(() => {
    if (!q) return [];
    const k = q.trim().toLowerCase();
    return allPatients
      .filter((p) => (p.name + p.id).toLowerCase().includes(k))
      .slice(0, 8);
  }, [q, allPatients]);

  const onPick = (id) => {
    setQ("");
    nav(`/cases/${id}`);
  };
  const onSubmit = () => {
    const k = q.trim();
    if (!k) return;
    const hit =
      suggestions[0] || allPatients.find((p) => p.id === k || p.name === k);
    setQ("");
    nav(`/cases/${hit ? hit.id : k}`);
  };

  return (
    <aside
      className="rightPane"
      style={{ padding: 12, ...style }}
      aria-label="右側功能區"
    >
      <div className="card" style={{ marginBottom: 12, position: "relative" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>選擇病患</div>
        <input
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
          }}
          placeholder="輸入姓名或編號…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          aria-label="病患搜尋"
        />
        {suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 78,
              left: 12,
              right: 12,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              zIndex: 10,
            }}
          >
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => onPick(s.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 10px",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <span>
                  {s.name} <span style={{ color: "#6b7280" }}>#{s.id}</span>
                </span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {formatLastReportDays(s.lastReportDays)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          病患列表（依風險）
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: 260,
            overflow: "auto",
          }}
        >
          {allPatients
            .slice()
            .sort((a, b) => rankRisk(a.risk) - rankRisk(b.risk))
            .slice(0, 12)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => onPick(p.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #eef2ff",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 14 }}>
                  {p.name} <span style={{ color: "#6b7280" }}>#{p.id}</span>
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color:
                      p.risk === "高"
                        ? "#b91c1c"
                        : p.risk === "中"
                        ? "#92400e"
                        : "#166534",
                  }}
                >
                  {p.risk}
                </span>
              </button>
            ))}
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 700 }}>AI 即時通報</div>
          <Chip>Live</Chip>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {alerts.map((a, i) => (
            <div key={i} style={{ fontSize: 14 }}>
              <span style={{ marginRight: 8 }}>🔔</span>
              <span style={{ fontWeight: 600 }}>{a.title}</span>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {a.time} · {a.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function rankRisk(r) {
  if (r === "高") return 0;
  if (r === "中") return 1;
  return 2;
}
