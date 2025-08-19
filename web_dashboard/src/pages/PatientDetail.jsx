import React, { useMemo, useState } from "react";
import "../styles/grid.css";
import { useParams } from "react-router-dom";
import PatientProfileCard from "../components/PatientProfileCard";
import PatientKpis from "../components/PatientKpis";
import PatientMetricsSmallMultiples from "../components/PatientMetricsSmallMultiples";
import TrendCatMmrcChart from "../components/TrendCatMmrcChart";
import EvaluationSuggestions from "../components/EvaluationSuggestions";
import {
  genDailyMetrics,
  genDailyCatMmrcTrend,
  randomBetween,
} from "../utils/mock";
import TimeRangeTabs from "../components/TimeRangeTabs";
import PatientGoals from "../components/PatientGoals";

export default function PatientDetail() {
  const { id } = useParams();
  const [profile] = useState(() => ({
    id,
    name: `病患 X${id}`,
    age: randomBetween(60, 78),
    sex: Math.random() > 0.5 ? "男" : "女",
    height: randomBetween(150, 175),
    weight: randomBetween(50, 82),
  }));
  const [range, setRange] = useState("week"); // week | month | quarter
  const [metrics] = useState(() => genDailyMetrics(120));
  const trend = useMemo(() => genDailyCatMmrcTrend(metrics.length), [metrics]);

  const sliceByRange = useMemo(() => {
    if (range === "week") return 7;
    if (range === "month") return 28;
    return 91; // quarter ≈ 13週 ≈ 91天
  }, [range]);

  const metricsView = useMemo(
    () => metrics.slice(-sliceByRange),
    [metrics, sliceByRange]
  );

  const trendView = useMemo(
    () => trend.slice(-sliceByRange),
    [trend, sliceByRange]
  );

  // 將日級 CAT/mMRC 聚合為月平均（for 近 4 個月）
  const trendMonthly = useMemo(() => {
    const map = new Map();
    const order = [];
    trendView.forEach((d) => {
      const [m] = String(d.day).split("/");
      const key = String(m).padStart(2, "0");
      if (!map.has(key)) {
        map.set(key, { count: 0, catSum: 0, mmrcSum: 0 });
        order.push(key);
      }
      const acc = map.get(key);
      acc.count += 1;
      acc.catSum += d.CAT || 0;
      acc.mmrcSum += d.mMRC || 0;
    });
    return order.map((k) => {
      const acc = map.get(k);
      const avg = (sum) => +(sum / Math.max(1, acc.count)).toFixed(1);
      return {
        month: `${k}月`,
        CAT: Math.round(avg(acc.catSum)),
        mMRC: avg(acc.mmrcSum),
      };
    });
  }, [trendView]);

  const adherence7d = useMemo(() => {
    const last7 = metricsView.slice(-7);
    const daysWithAll = last7.filter(
      (m) => m.medication && m.water_cc >= 1200 && m.exercise_min >= 10
    ).length;
    return Math.round((daysWithAll / Math.max(1, last7.length)) * 100);
  }, [metricsView]);

  const adherenceLabel = useMemo(() => {
    if (range === "week") return "近一週依從";
    if (range === "month") return "近一月依從";
    return "近一季依從";
  }, [range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <PatientProfileCard profile={profile} />
        <div style={{ marginLeft: "auto" }}>
          <TimeRangeTabs
            value={range}
            onChange={(key) => setRange(key)}
            items={[
              { key: "week", label: "週" },
              { key: "month", label: "月" },
              { key: "quarter", label: "季" },
            ]}
          />
        </div>
      </div>
      {/* KPI 與當日摘要 */}
      <div className="grid grid-cols-12" style={{ gap: 12 }}>
        <div className="col-span-6">
          <PatientKpis
            adherence7d={adherence7d}
            adherenceLabel={adherenceLabel}
            lastReportDay={metricsView.at(-1)?.day}
            lastMedication={Boolean(metricsView.at(-1)?.medication)}
          />
        </div>
        <div className="card col-span-2">
          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>
            最新 CAT
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {trendView.at(-1)?.CAT}
          </div>
        </div>
        <div className="card col-span-2">
          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>
            最新 mMRC
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {trendView.at(-1)?.mMRC}
          </div>
        </div>
        <div className="card col-span-2">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>AE次數(模擬)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#b91c1c" }}>
            {randomBetween(0, 3)}
          </div>
        </div>
      </div>

      {/* 目標 vs 實際 */}
      <div className="grid grid-cols-12" style={{ gap: 12 }}>
        <div className="col-span-12">
          <PatientGoals metrics={metrics} />
        </div>
      </div>

      {/* 趨勢與小倍數圖 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <TrendCatMmrcChart
          data={range === "quarter" ? trendMonthly : trendView}
          xKey={range === "quarter" ? "month" : "day"}
        />
        <PatientMetricsSmallMultiples
          data={metricsView}
          timeUnit={
            range === "month" ? "week" : range === "quarter" ? "month" : "day"
          }
        />
      </div>

      <EvaluationSuggestions metrics={metrics} />
    </div>
  );
}
