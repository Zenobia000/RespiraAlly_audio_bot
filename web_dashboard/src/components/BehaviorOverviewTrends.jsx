import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function BehaviorOverviewTrends({ data, range = "month" }) {
  // 計算達標率趨勢數據
  const achievementTrends = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    // 目標值設定（以週為基準）
    const weeklyTargets = {
      water_week_cc: 14000,
      med_week_days: 7,
      exercise_week_min: 90,
      cigs_week_count: 0,
    };

    return data.map((item) => {
      // 計算各項指標的達標率
      const waterRate =
        item.water_avg_cc && weeklyTargets.water_week_cc > 0
          ? Math.min(
              100,
              Math.round(
                ((item.water_avg_cc * 7) / weeklyTargets.water_week_cc) * 100
              )
            )
          : 0;

      const exerciseRate =
        item.exercise_avg_min && weeklyTargets.exercise_week_min > 0
          ? Math.min(
              100,
              Math.round(
                ((item.exercise_avg_min * 7) /
                  weeklyTargets.exercise_week_min) *
                  100
              )
            )
          : 0;

      const medicationRate = item.medication_rate || 0;

      // 抽菸指標：數值越低越好，達標率計算方式相反
      const cigaretteRate =
        item.cigarettes_avg !== undefined
          ? Math.max(0, Math.min(100, 100 - (item.cigarettes_avg / 10) * 100))
          : 100;

      return {
        ...item,
        water_achievement: waterRate,
        exercise_achievement: exerciseRate,
        medication_achievement: medicationRate,
        cigarette_achievement: cigaretteRate,
        overall_achievement: Math.round(
          (waterRate + exerciseRate + medicationRate + cigaretteRate) / 4
        ),
      };
    });
  }, [data]);

  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        患者達標率趨勢（月平均）
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <MiniLine
          title="喝水達標率 (%)"
          dataKey="water_achievement"
          data={achievementTrends}
          color="#22c55e"
          suffix="%"
          range={range}
        />
        <MiniLine
          title="運動達標率 (%)"
          dataKey="exercise_achievement"
          data={achievementTrends}
          color="#06b6d4"
          suffix="%"
          range={range}
        />
        <MiniLine
          title="吸藥達標率 (%)"
          dataKey="medication_achievement"
          data={achievementTrends}
          color="#3b82f6"
          suffix="%"
          range={range}
        />
        <MiniLine
          title="戒菸達標率 (%)"
          dataKey="cigarette_achievement"
          data={achievementTrends}
          color="#a78bfa"
          suffix="%"
          range={range}
        />
      </div>

      {/* 整體達標率概覽 */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12, color: "#374151" }}>
          整體達標率趨勢
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={achievementTrends}>
              <defs>
                <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eef2ff" vertical={false} />
              <XAxis
                dataKey={range === "month" ? "month" : "x"}
                stroke="#6b7280"
              />
              <YAxis
                stroke="#6b7280"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "整體達標率"]}
                labelStyle={{ color: "#374151" }}
              />
              <Area
                type="monotone"
                dataKey="overall_achievement"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#overallGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MiniLine({
  title,
  dataKey,
  data,
  color = "#16a34a",
  suffix = "",
  range = "month",
}) {
  return (
    <div>
      <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id={`grad-${dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eef2ff" vertical={false} />
            <XAxis
              dataKey={range === "month" ? "month" : "x"}
              stroke="#6b7280"
            />
            <YAxis
              stroke="#6b7280"
              domain={suffix === "%" ? [0, 100] : undefined}
              tickFormatter={
                suffix === "%" ? (value) => `${value}%` : undefined
              }
            />
            <Tooltip formatter={(v) => `${v}${suffix}`} />
            <Legend />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniBar({ title, dataKey, data, color = "#a78bfa", range = "month" }) {
  return (
    <div>
      <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#eef2ff" vertical={false} />
            <XAxis
              dataKey={range === "month" ? "month" : "x"}
              stroke="#6b7280"
            />
            <YAxis
              stroke="#6b7280"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
