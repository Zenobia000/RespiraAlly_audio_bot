import React, { useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SidebarNav from "./layout/SidebarNav";
import Header from "./layout/Header";
import RightPane from "./layout/RightPane";
import OverviewPage from "./pages/OverviewPage";
import CasesPage from "./pages/CasesPage";
import EducationPage from "./pages/EducationPage";
import TherapistTasksPage from "./pages/TherapistTasksPage";
import "./styles/index.css";
import { genPatients } from "./utils/mock";

function Frame({ title, children }) {
  const alerts = [
    {
      title: "依從性降低",
      time: "5 分鐘前",
      detail: "#1023 近 3 天用藥中斷 2 次",
    },
    {
      title: "CAT 異常上升",
      time: "23 分鐘前",
      detail: "#1019 與上月相比 +6 分",
    },
    { title: "回報中斷", time: "1 小時前", detail: "#1044 連續 3 天未回報" },
  ];
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <SidebarNav />
      <div className="main-content">
        <Header title={title} />
        <div style={{ padding: "12px 0" }}>{children}</div>
      </div>
      <RightPane
        alerts={alerts}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          height: "100vh",
          width: "280px",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.3)",
          zIndex: 999,
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route
          path="/overview"
          element={
            <Frame title="病患整體趨勢總覽">
              <OverviewPage />
            </Frame>
          }
        />
        <Route
          path="/cases/*"
          element={
            <Frame title="個案管理">
              <CasesPage />
            </Frame>
          }
        />
        <Route
          path="/education"
          element={
            <Frame title="衛教知識庫">
              <EducationPage />
            </Frame>
          }
        />
        <Route
          path="/tasks"
          element={
            <Frame title="日曆排程">
              <TherapistTasksPage />
            </Frame>
          }
        />
        <Route
          path="/settings"
          element={
            <Frame title="設定">
              <div style={{ padding: "40px", textAlign: "center" }}>
                <h2>⚙️ 系統設定</h2>
                <p style={{ color: "#64748b", marginTop: "16px" }}>
                  設定功能開發中...
                </p>
              </div>
            </Frame>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
