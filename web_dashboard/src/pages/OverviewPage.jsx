import React, { useMemo, useState } from "react";
import KpiRow from "../components/KpiRow";
import TrendCatMmrcChart from "../components/TrendCatMmrcChart";
import RiskAdherencePie from "../components/RiskAdherencePie";
import BehaviorAdherenceTrend from "../components/BehaviorAdherenceTrend";
import PatientGroupList from "../components/PatientGroupList";
import BehaviorOverviewTrends from "../components/BehaviorOverviewTrends";
import TimeRangeTabs from "../components/TimeRangeTabs";
import {
  genMonthlyCatMmrc,
  genRiskAdherence,
  genPatients,
  genOverviewBehaviorTrends,
  genBehaviorOverviewSeries,
} from "../utils/mock";

export default function OverviewPage() {
  const monthly = useMemo(() => genMonthlyCatMmrc(), []);
  const risk = useMemo(() => genRiskAdherence(), []);
  const behavior = useMemo(() => genOverviewBehaviorTrends(), []);
  const [range, setRange] = useState("month");
  const behaviorSeries = useMemo(
    () => genBehaviorOverviewSeries(range),
    [range]
  );
  const allPatients = useMemo(() => genPatients(60), []);
  const highRisk = useMemo(
    () => allPatients.filter((p) => p.risk === "高").slice(0, 8),
    [allPatients]
  );
  const lowAdh = useMemo(
    () => allPatients.filter((p) => p.adherence7d <= 60).slice(0, 8),
    [allPatients]
  );

  const kpis = [
    { label: "病患總數", value: 126 },
    {
      label: "CAT 平均分數",
      value: Math.round(
        monthly.reduce((a, b) => a + b.CAT, 0) / monthly.length
      ),
    },
    {
      label: "mMRC 平均等級",
      value: +(
        monthly.reduce((a, b) => a + b.mMRC, 0) / monthly.length
      ).toFixed(1),
    },
    { label: "高風險佔比", value: `${risk.highRisk}%`, color: "var(--danger)" },
  ];

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <KpiRow items={kpis} />
        <TimeRangeTabs value={range} onChange={setRange} />
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 12 }}
      >
        <TrendCatMmrcChart data={monthly} xKey="month" />
        <RiskAdherencePie
          highRiskPct={risk.highRisk}
          lowAdhPct={risk.lowAdherence}
        />
      </div>
      <BehaviorAdherenceTrend range={range} />
      <BehaviorOverviewTrends
        data={range === "month" ? behavior : behaviorSeries}
        range={range}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <PatientGroupList title="高風險族群（Top 8）" patients={highRisk} />
        <PatientGroupList title="低依從族群（≤60%，Top 8）" patients={lowAdh} />
      </div>
    </div>
  );
}
