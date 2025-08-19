import React, { useMemo, useState } from "react";

// 顯示病患目標與實際值（週/月/季），每項 col-span-3（搭配 .grid.grid-cols-12）
export default function PatientGoals({ metrics }) {
  const [timeUnit, setTimeUnit] = useState("week"); // week | month | quarter
  // 目標值（以週為基準），可由治療師調整
  const [targets, setTargets] = useState({
    water_week_cc: 14000,
    med_week_days: 7,
    exercise_week_min: 90,
    cigs_week_count: 0,
  });

  const factor = timeUnit === "week" ? 1 : timeUnit === "month" ? 4 : 13; // 4 週/月, 13 週/季
  const windowDays = timeUnit === "week" ? 7 : timeUnit === "month" ? 28 : 91;

  const recent = useMemo(
    () => metrics.slice(-windowDays),
    [metrics, windowDays]
  );

  const actual = useMemo(() => {
    const water = recent.reduce((a, b) => a + (b.water_cc || 0), 0);
    const med = recent.reduce((a, b) => a + (b.medication ? 1 : 0), 0);
    const exercise = recent.reduce((a, b) => a + (b.exercise_min || 0), 0);
    const cigs = recent.reduce((a, b) => a + (b.cigarettes || 0), 0);
    return { water, med, exercise, cigs };
  }, [recent]);

  const target = {
    water: targets.water_week_cc * factor,
    med: targets.med_week_days * factor,
    exercise: targets.exercise_week_min * factor,
    cigs: targets.cigs_week_count * factor,
  };

  const updateTarget = (key, value) => {
    setTargets((t) => ({ ...t, [key]: Number(value) }));
  };

  return (
    <div
      className="card"
      aria-label="目標與實際"
      style={{ maxWidth: "100%", overflow: "hidden" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>目標 vs 實際</div>
        <select
          value={timeUnit}
          onChange={(e) => setTimeUnit(e.target.value)}
          aria-label="時間單位"
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            minWidth: 120,
          }}
        >
          <option value="week">週</option>
          <option value="month">月</option>
          <option value="quarter">季</option>
        </select>
      </div>

      <div className="grid grid-cols-12" style={{ gap: 12, maxWidth: "100%" }}>
        <GoalItem
          className="col-span-4"
          label="喝水"
          unit="cc"
          actual={actual.water}
          target={target.water}
          control={
            <NumberInput
              value={targets.water_week_cc}
              onChange={(v) => updateTarget("water_week_cc", v)}
              suffix="/週"
            />
          }
        />
        <GoalItem
          className="col-span-4"
          label="吸藥"
          unit="天"
          actual={actual.med}
          target={target.med}
          control={
            <NumberInput
              value={targets.med_week_days}
              onChange={(v) => updateTarget("med_week_days", v)}
              suffix="/週"
            />
          }
        />
        <GoalItem
          className="col-span-4"
          label="運動"
          unit="min"
          actual={actual.exercise}
          target={target.exercise}
          control={
            <NumberInput
              value={targets.exercise_week_min}
              onChange={(v) => updateTarget("exercise_week_min", v)}
              suffix="/週"
            />
          }
        />
      </div>
    </div>
  );
}

function GoalItem({ className, label, unit, actual, target, control }) {
  const pct =
    target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  return (
    <div className={className}>
      <div className="card" style={{ height: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ color: "var(--muted)", fontSize: 12 }}>{label}</div>
          <div>{control}</div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>
          {actual} / {target} {unit}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>達標率</div>
          <div
            style={{
              fontWeight: 700,
              color: pct >= 100 ? "#16a34a" : "#2563eb",
            }}
          >
            {pct}%
          </div>
        </div>
        <div
          style={{
            height: 8,
            background: "#eef2ff",
            borderRadius: 99,
            marginTop: 10,
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: 8,
              borderRadius: 99,
              background: pct >= 100 ? "#16a34a" : "#60a5fa",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, suffix }) {
  return (
    <span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 80,
          padding: 6,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          marginRight: 6,
        }}
      />
      <span style={{ fontSize: 12, color: "#6b7280" }}>{suffix}</span>
    </span>
  );
}
