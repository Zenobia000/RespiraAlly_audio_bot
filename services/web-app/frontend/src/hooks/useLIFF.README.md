# useLIFF Hook 使用說明

## 概述

重新設計的 `useLIFF.js` 支援路徑感知的 LIFF 初始化，並統一使用根目錄環境變數配置：

- **Dashboard 路徑** (`/dashboard/*`) 完全不涉及 LIFF，供治療師使用
- **LIFF 路徑** (`/liff/*`) 提供完整的 LINE LIFF 功能，供病患使用
- **環境變數統一** 所有配置統一在根目錄 `.env` 檔案中管理

## 核心特性

### 1. 路徑感知

- 自動檢測當前路徑是否為 `/liff/*`
- 只在 LIFF 路徑下才會初始化 LINE SDK
- Dashboard 路徑返回空的實現，不會載入 LIFF SDK

### 2. 環境模式支援

- **開發模式**：`import.meta.env.DEV = true` 自動使用 Mock 數據
- **Mock 模式**：`VITE_ENABLE_MOCK=true` 使用測試用戶數據
- **強制開發模式**：`VITE_FORCE_DEV_MODE=true` 強制使用 Mock 數據（用於 UI 開發）
- **禁用模式**：`VITE_DISABLE_LIFF=true` 完全禁用 LIFF 功能
- **生產模式**：進行真實的 LINE LIFF 初始化和認證

### 3. 動態 SDK 載入

- 只在需要時才載入 LIFF SDK
- 避免在 Dashboard 中載入不必要的外部腳本

## 使用方式

### 基本用法

```javascript
import { useLIFF } from "../hooks/useLIFF";

const MyComponent = () => {
  const { isLoggedIn, profile, isInClient, isReady, error, login, logout } =
    useLIFF();

  if (!isReady) {
    return <div>載入中...</div>;
  }

  if (error) {
    return <div>錯誤：{error}</div>;
  }

  return (
    <div>
      {isLoggedIn ? (
        <div>歡迎，{profile.displayName}！</div>
      ) : (
        <button onClick={login}>登入 LINE</button>
      )}
    </div>
  );
};
```

### 路徑行為

#### 在 `/dashboard/*` 路徑

```javascript
const { isLoggedIn, profile } = useLIFF();
// isLoggedIn = false
// profile = null
// 所有 LIFF 功能都是空實現
```

#### 在 `/liff/*` 路徑（開發模式）

```javascript
const { isLoggedIn, profile } = useLIFF();
// isLoggedIn = true
// profile = { userId: "ui-dev-user", displayName: "UI 測試用戶", ... }
```

#### 在 `/liff/*` 路徑（生產模式）

```javascript
const { isLoggedIn, profile } = useLIFF();
// 進行真實的 LIFF 初始化
// 如果用戶已登入 LINE，isLoggedIn = true，profile 為真實用戶資料
// 如果用戶未登入，isLoggedIn = false，需要呼叫 login()
```

## 環境變數配置

根據用戶的命名習慣，所有環境變數統一在**根目錄** `.env` 檔案中配置：

```bash
# LINE Bot 和 LIFF 設定
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LIFF_CHANNEL_ID=your_liff_channel_id

# 前端配置
VITE_API_BASE_URL=http://localhost:5000
VITE_LIFF_ID=${LIFF_CHANNEL_ID}
VITE_ENABLE_MOCK=false
VITE_ENV=development
VITE_FORCE_DEV_MODE=true    # UI 開發時設為 true

# 其他服務配置...
```

### 環境變數說明

- `LIFF_CHANNEL_ID`: LINE LIFF App ID（後端和前端共用）
- `VITE_LIFF_ID`: 前端使用的 LIFF ID，通常設為 `${LIFF_CHANNEL_ID}`
- `VITE_FORCE_DEV_MODE`: 強制開發模式，用於 UI 開發時跳過真實 LIFF 初始化
- `VITE_ENABLE_MOCK`: 啟用 Mock 模式
- `VITE_DISABLE_LIFF`: 完全禁用 LIFF 功能

### 不同環境的配置範例

```bash
# 開發環境 - 使用 Mock 數據
VITE_FORCE_DEV_MODE=true
VITE_ENABLE_MOCK=true

# ngrok 測試環境 - 使用真實 LIFF
VITE_FORCE_DEV_MODE=false
VITE_ENABLE_MOCK=false
VITE_LIFF_ID=your_real_liff_id_here

# 生產環境 - 使用真實 LIFF
VITE_FORCE_DEV_MODE=false
VITE_ENABLE_MOCK=false
VITE_LIFF_ID=your_production_liff_id

# 完全禁用 LIFF（調試用）
VITE_DISABLE_LIFF=true
```

## API 參考

### 狀態屬性

- `isLoggedIn: boolean` - 用戶是否已登入 LINE
- `profile: object | null` - 用戶基本資料
- `isInClient: boolean` - 是否在 LINE 應用內執行
- `isReady: boolean` - LIFF 是否初始化完成
- `error: string | null` - 錯誤訊息
- `idToken: string | null` - LINE ID Token
- `needsRegistration: boolean` - 是否需要註冊
- `authProcessing: boolean` - 是否正在處理認證

### 方法

- `login()` - 觸發 LINE 登入
- `logout()` - 登出並重新載入頁面
- `getAccessToken()` - 取得 LINE Access Token
- `openExternalBrowser(url)` - 開啟外部瀏覽器
- `closeWindow()` - 關閉 LIFF 視窗
- `shareMessage(messages)` - 分享訊息到 LINE
- `handleRegisterSuccess(userData)` - 處理註冊成功

## 故障排除

### 問題：在 Dashboard 中看到 LIFF 錯誤

**解決**：檢查路徑是否正確，Dashboard 應該使用 `/dashboard/*` 路徑

### 問題：LIFF 初始化失敗

**解決**：

1. 確認 `VITE_LIFF_ID` 是否正確設定
2. 檢查 LINE Developers Console 中的 LIFF App 設定
3. 確認 Endpoint URL 是否正確

### 問題：開發時想測試真實 LIFF

**解決**：設定 `VITE_ENABLE_MOCK=false` 並提供有效的 `VITE_LIFF_ID`

## 移轉說明

從舊版本移轉到新版本：

1. **環境變數**：添加 `VITE_DISABLE_LIFF` 和 `VITE_ENABLE_MOCK`
2. **路由檢查**：確保 LIFF 頁面使用 `/liff/*` 路徑
3. **Dashboard 檢查**：確保治療師端使用 `/dashboard/*` 路徑
4. **錯誤處理**：檢查組件是否正確處理 `error` 狀態

## 範例

完整的 LIFF 頁面範例請參考：

- `src/apps/liff/pages/PatientHome.jsx`
- `src/apps/liff/pages/DailyMetrics.jsx`
