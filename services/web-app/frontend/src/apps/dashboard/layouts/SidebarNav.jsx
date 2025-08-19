import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";

const SidebarNav = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const navItems = [
    {
      path: "/dashboard/overview",
      label: "病患總覽",
      icon: "📊",
      description: "整體數據概覽",
    },
    {
      path: "/dashboard/cases",
      label: "個案管理",
      icon: "👥",
      description: "病患管理與追蹤",
    },
    {
      path: "/dashboard/education",
      label: "衛教知識",
      icon: "📚",
      description: "COPD 衛教問答",
    },
    {
      path: "/dashboard/tasks",
      label: "日曆排程",
      icon: "📅",
      description: "任務與排程管理",
    },
    {
      path: "/dashboard/settings",
      label: "設定",
      icon: "⚙️",
      description: "系統與個人設定",
    },
  ];

  const isActive = (path) => {
    if (
      path === "/dashboard/cases" &&
      location.pathname.startsWith("/dashboard/cases")
    ) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <nav className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo 區域 */}
      <div className="sidebar-header">
        <div className="logo-container">
          {!collapsed && (
            <>
              <span className="logo-icon">🫁</span>
              <span className="logo-text">RespiraAlly</span>
            </>
          )}
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            aria-label={collapsed ? "展開側邊欄" : "收合側邊欄"}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>
      </div>

      {/* 導航項目 */}
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {hoveredItem === item.path && (
                    <span className="nav-tooltip">{item.description}</span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* 使用者資訊 */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">呼吸治療師</div>
              <div className="user-role">管理員</div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .sidebar {
          width: 240px;
          background: linear-gradient(180deg, #ecf6ff, #f7f5ff);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width 200ms ease;
          position: relative;
        }

        .sidebar.collapsed {
          width: 60px;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-icon {
          font-size: 24px;
          margin-right: 8px;
        }

        .logo-text {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary);
        }

        .sidebar-toggle {
          background: white;
          border: 1px solid var(--border);
          border-radius: 6px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 200ms;
        }

        .sidebar-toggle:hover {
          background: var(--primary);
          color: white;
        }

        .nav-list {
          flex: 1;
          list-style: none;
          padding: 16px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          color: var(--text);
          text-decoration: none;
          transition: all 200ms;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(124, 198, 255, 0.1);
        }

        .nav-item.active {
          background: rgba(124, 198, 255, 0.2);
          border-left: 3px solid var(--primary);
        }

        .nav-icon {
          font-size: 20px;
          margin-right: 12px;
          min-width: 20px;
        }

        .nav-label {
          font-weight: 500;
        }

        .nav-tooltip {
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
          background: var(--text);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 100;
          pointer-events: none;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-name {
          font-weight: 500;
          font-size: 14px;
        }

        .user-role {
          font-size: 12px;
          color: var(--muted);
        }

        .collapsed .nav-item {
          justify-content: center;
        }

        .collapsed .nav-icon {
          margin-right: 0;
        }
      `}</style>
    </nav>
  );
};

export default SidebarNav;
