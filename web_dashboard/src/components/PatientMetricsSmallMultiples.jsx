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
} from "recharts";

export default function PatientMetricsSmallMultiples({
  data,
  timeUnit = "day",
}) {
  // 依時間單位聚合 x 軸與資料
  const grouped = useMemo(() => {
    if (timeUnit === "week") {
      // 簡化週聚合：每 7 筆為一週平均
      const chunks = [];
      for (let i = 0; i < data.length; i += 7) {
        const seg = data.slice(i, i + 7);
        if (seg.length === 0) continue;
        const avg = (arr, k) =>
          Math.round(arr.reduce((a, b) => a + (b[k] || 0), 0) / arr.length);
        const medRate = Math.round(
          (seg.reduce((a, b) => a + (b.medication ? 1 : 0), 0) / seg.length) *
            100
        );
        chunks.push({
          day: `W${Math.floor(i / 7) + 1}`,
          water_cc: avg(seg, "water_cc"),
          exercise_min: avg(seg, "exercise_min"),
          cigarettes: avg(seg, "cigarettes"),
          medication: medRate, // 週平均轉百分比
        });
      }
      return chunks;
    }
    if (timeUnit === "month") {
      const map = new Map();
      const order = [];
      data.forEach((d) => {
        const [m] = String(d.day).split("/");
        const key = String(m).padStart(2, "0");
        if (!map.has(key)) {
          map.set(key, {
            count: 0,
            water: 0,
            exercise: 0,
            cigs: 0,
            medDays: 0,
          });
          order.push(key);
        }
        const acc = map.get(key);
        acc.count += 1;
        acc.water += d.water_cc || 0;
        acc.exercise += d.exercise_min || 0;
        acc.cigs += d.cigarettes || 0;
        acc.medDays += d.medication ? 1 : 0;
      });
      return order.map((k) => {
        const acc = map.get(k);
        const avg = (sum) => Math.round(sum / Math.max(1, acc.count));
        const medRate = Math.round(
          (acc.medDays / Math.max(1, acc.count)) * 100
        );
        return {
          day: `${k}月`,
          water_cc: avg(acc.water),
          exercise_min: avg(acc.exercise),
          cigarettes: avg(acc.cigs),
          medication: medRate,
        };
      });
    }
    // day（默認）
    return data;
  }, [data, timeUnit]);
  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>個人健康追蹤</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <MiniLine
          title="喝水 (cc)"
          dataKey="water_cc"
          data={grouped}
          yTicks={[0, 500, 1000, 1500, 2000, 2500]}
          yDomain={[0, 2500]}
          xUnit={timeUnit}
        />
        <MiniLine
          title="運動 (分鐘)"
          dataKey="exercise_min"
          data={grouped}
          yTicks={[0, 15, 30, 45, 60]}
          yDomain={[0, 60]}
          xUnit={timeUnit}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 12,
        }}
      >
        <MiniBar
          title="吸菸（支）"
          dataKey="cigarettes"
          data={grouped}
          yTicks={[0, 5, 10, 15, 20]}
          yDomain={[0, 20]}
          xUnit={timeUnit}
        />
        {timeUnit !== "day" ? (
          <MiniBar
            title="吸藥（%）"
            dataKey="medication"
            data={grouped}
            yTicks={[0, 20, 40, 60, 80, 100]}
            yDomain={[0, 100]}
            xUnit={timeUnit}
            color="#3b82f6"
          />
        ) : (
          <MiniMosaic
            title="吸藥（有/無）"
            dataKey="medication"
            data={grouped}
            colorOn="#34d399"
            colorOff="#e5e7eb"
          />
        )}
      </div>
    </div>
  );
}

function MiniLine({ title, dataKey, data, yTicks, yDomain, xUnit = "day" }) {
  const xLabel = xUnit === "week" ? "週" : "日期";
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div style={{ color: "var(--muted)", fontSize: 12 }}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "#16a34a",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 11, color: "#6b7280" }}>數值</span>
        </div>
      </div>
      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 24, left: 28 }}
          >
            <defs>
              <linearGradient
                id={`grad-${dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eef2ff" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              interval="preserveStartEnd"
              label={{
                value: xLabel,
                position: "insideBottom",
                offset: -8,
                style: { fill: "#6b7280", fontSize: 12 },
              }}
            />
            <YAxis
              ticks={yTicks}
              domain={yDomain}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#6b7280" }}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#16a34a"
              strokeWidth={2}
              fill={`url(#grad-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniBar({
  title,
  dataKey,
  data,
  yTicks,
  yDomain,
  xUnit = "day",
  color = "#a78bfa",
}) {
  const xLabel = xUnit === "week" ? "週" : "日期";
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div style={{ color: "var(--muted)", fontSize: 12 }}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: color,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 11, color: "#6b7280" }}>數值</span>
        </div>
      </div>
      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 24, left: 28 }}
          >
            <CartesianGrid stroke="#eef2ff" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              interval="preserveStartEnd"
              label={{
                value: xLabel,
                position: "insideBottom",
                offset: -8,
                style: { fill: "#6b7280", fontSize: 12 },
              }}
            />
            <YAxis
              ticks={yTicks}
              domain={yDomain}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#6b7280" }}
            />
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniMosaic({
  title,
  dataKey,
  data,
  colorOn = "#34d399",
  colorOff = "#e5e7eb",
}) {
  const total = data?.length ?? 0;
  const tickStep = Math.max(1, Math.ceil(total / 6));
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div style={{ color: "var(--muted)", fontSize: 12 }}>{title}</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: colorOn,
                display: "inline-block",
              }}
            />{" "}
            有
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: colorOff,
                display: "inline-block",
              }}
            />{" "}
            無
          </span>
        </div>
      </div>
      <div style={{ height: 140, width: "100%" }}>
        <div style={{ marginLeft: 28, marginRight: 12, height: 100 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
              gap: 4,
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            {data.map((d, idx) => (
              <div
                key={idx}
                title={`${d.day}: ${d[dataKey] ? "有" : "無"}`}
                style={{
                  height: 16,
                  borderRadius: 4,
                  background: d[dataKey] ? colorOn : colorOff,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ marginLeft: 28, marginRight: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
              gap: 4,
            }}
          >
            {data.map((d, i) => (
              <div
                key={i}
                style={{ textAlign: "center", fontSize: 10, color: "#6b7280" }}
              >
                {i % tickStep === 0 ? d.day : ""}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
