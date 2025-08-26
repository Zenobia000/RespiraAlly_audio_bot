/**
 * 🎨 UI 開發版本 - 認證服務 Mock
 * 所有 API 呼叫都返回假數據，專注於 UI 開發
 */

class AuthService {
  constructor() {
    this.token = "mock-jwt-token";
  }

  storeToken(token) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  removeToken() {
    this.token = null;
  }

  isAuthenticated() {
    return true; // 永遠返回已認證
  }

  getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
  }

  async loginWithLineId(lineUserId) {
    console.log("🎨 Mock LINE 登入:", lineUserId);

    // 模擬成功回應
    return {
      success: true,
      data: {
        token: "mock-jwt-token",
        user: {
          id: 1,
          line_user_id: lineUserId,
          first_name: "測試",
          last_name: "用戶",
        },
      },
    };
  }

  async register(userData) {
    console.log("🎨 Mock 註冊:", userData);

    // 模擬成功回應
    return {
      success: true,
      data: {
        token: "mock-jwt-token",
        user: {
          id: 1,
          ...userData,
        },
      },
    };
  }

  logout() {
    console.log("🎨 Mock 登出");
  }

  async getCurrentUser() {
    // 模擬成功回應
    return {
      success: true,
      data: {
        id: 1,
        line_user_id: "ui-dev-user",
        first_name: "測試",
        last_name: "用戶",
        displayName: "UI 測試用戶",
      },
    };
  }
}

// 創建單例實例
export const authService = new AuthService();
export default authService;
