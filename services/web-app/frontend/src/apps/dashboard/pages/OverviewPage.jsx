import {
  useOverviewKpis,
  useOverviewTrends,
  useOverviewAdherence,
} from "../../../shared/api/hooks";
import KpiRow from "../components/KpiRow";
import TrendCatMmrcChart from "../components/TrendCatMmrcChart";
import RiskAdherencePie from "../components/RiskAdherencePie";
import BehaviorAdherenceTrend from "../components/BehaviorAdherenceTrend";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";

const OverviewPage = () => {
  // 取得總覽資料
  const { data: kpis, isLoading: kpisLoading } = useOverviewKpis();
  const { data: trends, isLoading: trendsLoading } = useOverviewTrends();
  const { data: adherence, isLoading: adherenceLoading } =
    useOverviewAdherence();

  if (kpisLoading || trendsLoading || adherenceLoading) {
    return <LoadingSpinner fullScreen message="載入總覽資料..." />;
  }

  return (
    <div className="overview-page">
      {/* KPI 卡片區 */}
      <section className="section">
        <KpiRow kpis={kpis} />
      </section>

      {/* 圖表區 - 第一排 */}
      <section className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">CAT & mMRC 月平均趨勢</h3>
          <TrendCatMmrcChart data={trends} />
        </div>

        <div className="chart-card">
          <h3 className="chart-title">風險與依從性分布</h3>
          <RiskAdherencePie kpis={kpis} />
        </div>
      </section>

      {/* 圖表區 - 第二排 */}
      <section className="section">
        <div className="chart-card full-width">
          <h3 className="chart-title">四大健康追蹤依從性趨勢</h3>
          <BehaviorAdherenceTrend data={adherence} />
        </div>
      </section>

      <style jsx>{`
        .overview-page {
          padding: 0;
        }

        .section {
          margin-bottom: 24px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .chart-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .chart-card.full-width {
          grid-column: 1 / -1;
        }

        .chart-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 16px;
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default OverviewPage;
