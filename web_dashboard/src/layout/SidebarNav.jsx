import React from "react";
import { Link, useLocation } from "react-router-dom";
import logoImage from "../asset/logo-demo3.png";
import bgImage from "../asset/毛玻璃_BG2.png";

export default function SidebarNav() {
  const location = useLocation();
  const nav = [
    { to: "/overview", label: "總覽", icon: "📊" },
    { to: "/cases", label: "個案管理", icon: "👥" },
    { to: "/education", label: "衛教知識庫", icon: "📚" },
    { to: "/tasks", label: "日曆排程", icon: "📅" },
    { to: "/settings", label: "設定", icon: "⚙️" },
  ];

  const sidebarStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    height: "100vh",
    width: "200px",
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${bgImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    backdropFilter: "blur(10px)",
    borderRight: "1px solid rgba(255, 255, 255, 0.2)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    boxShadow: "2px 0 20px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
  };

  const logoSectionStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "48px",
    paddingBottom: "24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
  };

  const navigationStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    flex: 1,
    justifyContent: "center",
    paddingTop: "20px",
  };

  const profileSectionStyle = {
    marginTop: "auto",
    paddingTop: "24px",
    borderTop: "1px solid rgba(255, 255, 255, 0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  };

  return (
    <aside style={sidebarStyle} aria-label="側邊導覽">
      {/* Logo Section */}
      <div style={logoSectionStyle}>
        <img
          src={logoImage}
          alt="RespiraAlly"
          width={48}
          height={48}
          style={{ borderRadius: 12, marginBottom: 12 }}
        />
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#4fc3f7",
              marginBottom: 4,
            }}
          >
            RespiraAlly
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={navigationStyle}>
        {nav.map((n) => {
          const isActive = location.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "16px 8px",
                borderRadius: "16px",
                textDecoration: "none",
                transition: "all 0.3s ease",
                background: isActive
                  ? "rgba(79, 195, 247, 0.2)"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(79, 195, 247, 0.4)"
                  : "1px solid transparent",
                color: isActive ? "#0277bd" : "#546e7a",
                fontWeight: isActive ? 600 : 500,
                fontSize: "14px",
                transform: isActive ? "translateX(4px)" : "translateX(0)",
                boxShadow: isActive
                  ? "0 4px 12px rgba(79, 195, 247, 0.3)"
                  : "none",
              }}
            >
              <span style={{ fontSize: "20px" }}>{n.icon}</span>
              <span style={{ textAlign: "center", lineHeight: 1.2 }}>
                {n.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div style={profileSectionStyle}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#90a4ae",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "18px",
          }}
        >
          👤
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#37474f" }}>
            Bobo
          </div>
          <div style={{ fontSize: "12px", color: "#78909c" }}>呼吸治療師</div>
        </div>
        <button
          style={{
            padding: "6px 16px",
            borderRadius: "20px",
            border: "1px solid #b0bec5",
            background: "rgba(255, 255, 255, 0.8)",
            color: "#546e7a",
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          LOG OUT
        </button>
      </div>
    </aside>
  );
}
