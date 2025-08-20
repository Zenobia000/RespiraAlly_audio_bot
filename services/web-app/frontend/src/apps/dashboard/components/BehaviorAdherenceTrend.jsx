import { useState } from "react";
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
  const [viewMode, setViewMode] = useState("individual"); // "individual" 或 "overall"

  // 格式化資料並轉換為百分比
  const formattedData = data.map((item) => {
    const 用藥 = Math.round((item.med_rate || 0) * 100);
    const 飲水 = Math.round((item.water_rate || 0) * 100);
    const 運動 = Math.round((item.exercise_rate || 0) * 100);
    const 戒菸追蹤 = Math.round((item.smoke_tracking_rate || 0) * 100);

    // 計算整體達標率（四項平均）
    const 整體達標率 = Math.round((用藥 + 飲水 + 運動 + 戒菸追蹤) / 4);

    return {
      week: item.date?.replace("2025-", "").replace("2024-", "") || "",
      用藥,
      飲水,
      運動,
      戒菸追蹤,
      整體達標率,
    };
  });

  const individualLines = [
    { key: "用藥", color: CHART_COLORS.medication },
    { key: "飲水", color: CHART_COLORS.water },
    { key: "運動", color: CHART_COLORS.exercise },
    { key: "戒菸追蹤", color: CHART_COLORS.cigarettes },
  ];

  const overallLine = [{ key: "整體達標率", color: "#7c3aed" }];

  return (
    <div className="behavior-adherence-container">
      {/* 視圖切換按鈕 */}
      <div className="view-controls">
        <div className="control-group">
          <button
            className={`control-btn ${
              viewMode === "individual" ? "active" : ""
            }`}
            onClick={() => setViewMode("individual")}
          >
            <span className="btn-icon">📊</span>
            分項達標率
          </button>
          <button
            className={`control-btn ${viewMode === "overall" ? "active" : ""}`}
            onClick={() => setViewMode("overall")}
          >
            <span className="btn-icon">📈</span>
            整體達標率
          </button>
        </div>

        {/* 當前模式說明 */}
        <div className="mode-description">
          {viewMode === "individual"
            ? "顯示四項健康追蹤的個別達標率趨勢"
            : "顯示四項健康追蹤的整體平均達標率"}
        </div>
      </div>

      {/* 圖表區域 */}
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

          {/* 根據視圖模式渲染不同的線條 */}
          {viewMode === "individual"
            ? individualLines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ fill: line.color, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))
            : overallLine.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.color}
                  strokeWidth={3}
                  dot={{ fill: line.color, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
        </LineChart>
      </ResponsiveContainer>

      <style jsx>{`
        .behavior-adherence-container {
          width: 100%;
        }

        .view-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
        }

        .control-group {
          display: flex;
          gap: 8px;
          background: white;
          padding: 4px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .control-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 200ms;
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }

        .control-btn:hover {
          background: #f3f4f6;
        }

        .control-btn.active {
          background: var(--primary);
          color: white;
        }

        .btn-icon {
          font-size: 16px;
        }

        .mode-description {
          font-size: 13px;
          color: var(--muted);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .view-controls {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .control-group {
            justify-content: center;
          }

          .mode-description {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default BehaviorAdherenceTrend;
