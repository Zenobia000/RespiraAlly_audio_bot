# Phase 2 測試指南 - 前後端整合測試

## 📋 Phase 2 完成項目檢查清單

### ✅ 已完成項目

- [x] **Education Hooks 建立** (`educationHooks.js`)

  - [x] useEducationList - 取得列表
  - [x] useEducationCategories - 取得類別
  - [x] useCreateEducation - 新增
  - [x] useUpdateEducation - 更新
  - [x] useDeleteEducation - 刪除
  - [x] useBatchImportEducation - 批量匯入
  - [x] exportEducationToCSV - 匯出功能

- [x] **EducationPage 改用 API**

  - [x] 使用 React Query hooks
  - [x] 實作 loading 狀態
  - [x] 實作 error 處理
  - [x] 整合所有 CRUD 操作

- [x] **移除 localStorage 依賴**

  - [x] 資料來源改為 Milvus API
  - [x] 類別改為動態載入

- [x] **EduItemCard 組件更新**
  - [x] 支援 keywords 欄位
  - [x] 支援 notes 欄位
  - [x] 類別從 props 傳入

## 🧪 測試步驟

### 1. 環境準備

```bash
# 1.1 確保 Milvus 正在運行
docker ps | grep milvus

# 1.2 設定環境變數
export OPENAI_API_KEY="your_api_key"
export MILVUS_URI="http://localhost:19530"

# 1.3 初始化資料（如果尚未執行）
cd services/ai-worker/worker/llm_app
python load_article.py
```

### 2. 啟動後端服務

```bash
cd services/web-app

# 安裝新的依賴
pip install pymilvus==2.3.0 openai==1.3.0 pandas==2.0.3 openpyxl==3.1.2

# 啟動 Flask
flask run
```

### 3. 後端 API 測試

```bash
# 測試 Milvus 連線與 API
python test_education_api.py
```

預期輸出：

```
✅ Successfully connected to Milvus collection: copd_qa
✅ Successfully generated embedding vector (dimension: 1536)
✅ Found 5 categories: 疾病知識, 治療方法, ...
✅ Successfully created item with ID: xxx
✅ Successfully deleted test item
🎉 All tests passed!
```

### 4. 啟動前端服務

```bash
cd services/web-app/frontend

# 確保環境變數正確
# .env 檔案
VITE_API_BASE_URL=http://localhost:5000
VITE_ENABLE_MOCK=false

# 啟動開發伺服器
npm run dev
```

### 5. 前端整合測試

#### 5.1 使用測試頁面

1. 開啟瀏覽器：`http://localhost:5173/test_education_integration.html`
2. 取得 JWT Token：
   - 先登入 Dashboard
   - 在瀏覽器 Console 執行：`localStorage.getItem('token')`
   - 將 token 貼到測試頁面
3. 執行「執行所有測試」按鈕

#### 5.2 手動測試 Dashboard

1. 登入：`http://localhost:5173/login`
2. 前往衛教資源頁面：`http://localhost:5173/dashboard/education`
3. 測試功能：
   - [ ] 頁面載入顯示資料
   - [ ] 類別篩選功能
   - [ ] 搜尋功能
   - [ ] 新增問答
   - [ ] 編輯問答
   - [ ] 刪除問答
   - [ ] 匯出 CSV
   - [ ] 匯入 CSV

### 6. 常見問題排查

#### 問題：Milvus 連線失敗

```bash
# 檢查 Milvus 狀態
docker logs milvus-standalone

# 測試連線
curl http://localhost:19530/health
```

#### 問題：OpenAI API 錯誤

```bash
# 確認 API Key
echo $OPENAI_API_KEY

# 測試 API
python -c "from openai import OpenAI; client = OpenAI(); print('OK')"
```

#### 問題：CORS 錯誤

確保 Flask 有啟用 CORS：

```python
# app.py
from flask_cors import CORS
CORS(app)
```

#### 問題：前端無法連接後端

檢查：

1. API_BASE_URL 設定是否正確
2. Token 是否有效
3. 網路是否通暢

## 📊 測試檢查表

### 功能測試

- [ ] 列表載入（GET /education）
- [ ] 類別載入（GET /education/categories）
- [ ] 新增功能（POST /education）
- [ ] 更新功能（PUT /education/{id}）
- [ ] 刪除功能（DELETE /education/{id}）
- [ ] 批量匯入（POST /education/batch）
- [ ] CSV 匯出（前端功能）

### 整合測試

- [ ] 前端可以取得資料
- [ ] 新增後立即顯示
- [ ] 更新後立即反映
- [ ] 刪除後立即移除
- [ ] 錯誤訊息正確顯示

### 效能測試

- [ ] 載入 1000 筆資料的速度
- [ ] 向量生成時間 < 1 秒
- [ ] API 回應時間 < 500ms

## 🎯 驗收標準

1. **資料同步**：前端操作立即反映到 Milvus
2. **錯誤處理**：所有錯誤都有適當提示
3. **使用體驗**：流暢無卡頓，載入有提示
4. **資料完整**：所有欄位（含 keywords, notes）都能 CRUD

## 📝 測試報告模板

```markdown
測試日期：2024-XX-XX
測試人員：XXX

### 環境資訊

- Milvus 版本：2.3.x
- OpenAI Model：text-embedding-3-small
- 瀏覽器：Chrome XXX

### 測試結果

| 功能     | 狀態 | 備註       |
| -------- | ---- | ---------- |
| 連線測試 | ✅   | -          |
| 取得列表 | ✅   | 載入 50 筆 |
| 新增資料 | ✅   | ID: 123    |
| 更新資料 | ✅   | -          |
| 刪除資料 | ✅   | -          |
| 批量匯入 | ✅   | 10 筆成功  |

### 問題記錄

- 無

### 建議改進

- 可加入分頁功能
- 可加入排序功能
```

## 🚀 下一步

Phase 2 完成後，可以進行：

1. **Phase 3**：資料同步與遷移
2. **Phase 4**：進階功能（相似推薦等）
3. **效能優化**：加入快取、分頁等
