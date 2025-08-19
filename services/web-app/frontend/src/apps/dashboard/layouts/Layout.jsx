import { Outlet } from "react-router-dom";
import { useState } from "react";
import SidebarNav from "./SidebarNav";
import Header from "./Header";
import RightPane from "./RightPane";

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPaneVisible, setRightPaneVisible] = useState(true);

  return (
    <div className="app-layout">
      {/* 側邊導航 */}
      <SidebarNav
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 主要內容區 */}
      <div className="main-content">
        {/* 頂部標題列 */}
        <Header
          onToggleRightPane={() => setRightPaneVisible(!rightPaneVisible)}
        />

        {/* 內容區域 */}
        <main className="content">
          <Outlet />
        </main>
      </div>

      {/* 右側輔助欄 */}
      {rightPaneVisible && <RightPane />}
    </div>
  );
};

export default Layout;
