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
import { genUsageBehaviorSeries } from "../utils/mock";

export default function BehaviorAdherenceTrend({ range = "month" }) {
  const data = genUsageBehaviorSeries(range);
  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        使用行為分佈（登入/回報頻率）
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#eef2ff" vertical={false} />
            <XAxis dataKey="x" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="login" fill="#93c5fd" />
            <Bar dataKey="report" fill="#86efac" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
