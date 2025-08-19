import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { months, randomBetween } from "../utils/mock";

export default function UsageDistributionChart() {
  const data = months.map((m) => ({
    month: m,
    active: randomBetween(40, 120),
    returns: randomBetween(20, 80),
  }));
  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>使用分布（簡化）</div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#eef2ff" vertical={false} />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="active" fill="#60a5fa" />
            <Bar dataKey="returns" fill="#22d3ee" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
