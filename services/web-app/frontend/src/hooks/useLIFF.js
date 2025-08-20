import { useState, useEffect } from "react";
import { useAuth } from "../shared/contexts/AuthContext";

// 檢查是否為開發模式且禁用 LIFF
const isDevelopment = import.meta.env.DEV;
const disableLiff = import.meta.env.VITE_DISABLE_LIFF === "true";
const enableMock = import.meta.env.VITE_ENABLE_MOCK === "true";

// 🎨 UI 開發版本 - 移除所有 LINE 認證邏輯
export const useLIFF = () => {
  const _auth = useAuth();

  // 直接提供 mock 狀態
  const [state] = useState({
    isLoggedIn: true,
    profile: {
      userId: "ui-dev-user",
      displayName: "UI 測試用戶",
      pictureUrl: "https://via.placeholder.com/200x200/4A90E2/FFFFFF?text=UI",
      statusMessage: "UI 開發中",
    },
    isInClient: false,
    isReady: true,
    error: null,
    idToken: "mock-token",
    needsRegistration: false,
    authProcessing: false,
  });

  useEffect(() => {
    // 清理任何可能的 LIFF SDK 引用
    if (typeof window !== "undefined") {
      window.liff = null;
      delete window.liff;
    }

    if (isDevelopment || enableMock || disableLiff) {
      console.log("🎨 UI 開發模式 - 直接提供測試數據，無需任何認證");
      console.log("環境變數:", { isDevelopment, enableMock, disableLiff });
    }
  }, []);

  // Mock 函數
  const login = () => {
    console.log("🎨 Mock 登入");
  };

  const logout = () => {
    console.log("🎨 Mock 登出");
    window.location.reload();
  };

  const handleRegisterSuccess = async (userData) => {
    console.log("🎨 Mock 註冊成功:", userData);
  };

  const getAccessToken = () => {
    return "mock-access-token";
  };

  const openExternalBrowser = (url) => {
    window.open(url, "_blank");
  };

  const closeWindow = () => {
    console.log("🎨 Mock 關閉視窗");
  };

  const shareMessage = async (messages) => {
    console.log("🎨 Mock 分享訊息:", messages);
    return true;
  };

  return {
    ...state,
    login,
    logout,
    handleRegisterSuccess,
    getAccessToken,
    openExternalBrowser,
    closeWindow,
    shareMessage,
    // 額外狀態
    isBackendAuthenticated: true,
    backendUser: {
      id: 1,
      first_name: "測試",
      last_name: "用戶",
    },
  };
};
