import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "../../../shared/config";

const BehaviorAdherenceTrend = ({ data = [], height = 300 }) => {
  // 格式化資料並轉換為百分比
  const formattedData = data.map((item) => ({
    week: item.date?.replace("2025-", "").replace("2024-", "") || "",
    用藥: Math.round((item.med_rate || 0) * 100),
    飲水: Math.round((item.water_rate || 0) * 100),
    運動: Math.round((item.exercise_rate || 0) * 100),
    戒菸追蹤: Math.round((item.smoke_tracking_rate || 0) * 100),
  }));

  const lines = [
    { key: "用藥", color: CHART_COLORS.medication },
    { key: "飲水", color: CHART_COLORS.water },
    { key: "運動", color: CHART_COLORS.exercise },
    { key: "戒菸追蹤", color: CHART_COLORS.cigarettes },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={formattedData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#6B7280" />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          tick={{ fontSize: 12 }}
          stroke="#6B7280"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
          }}
          formatter={(value) => `${value}%`}
        />
        <Legend wrapperStyle={{ paddingTop: "10px" }} iconType="line" />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={{ fill: line.color, r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BehaviorAdherenceTrend;
