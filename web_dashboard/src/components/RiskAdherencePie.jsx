import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export default function RiskAdherencePie({ highRiskPct, lowAdhPct }) {
  const data1 = [
    { name: "高風險", value: highRiskPct },
    { name: "其他", value: 100 - highRiskPct },
  ];
  const data2 = [
    { name: "低依從", value: lowAdhPct },
    { name: "其他", value: 100 - lowAdhPct },
  ];
  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>風險／依從性佔比</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data1}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                label
              >
                {data1.map((_, i) => (
                  <Cell key={i} fill={["#ef4444", "#c7d2fe"][i % 2]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data2}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                label
              >
                {data2.map((_, i) => (
                  <Cell key={i} fill={["#22d3ee", "#c7d2fe"][i % 2]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
