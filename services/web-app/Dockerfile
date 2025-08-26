# services/web-app/Dockerfile
# 多階段建置：第一階段建置前端，第二階段建置後端

# ===============================================
# Stage 1: 建置 React 前端
# ===============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 複製前端相關檔案
COPY frontend/package*.json ./
COPY frontend/vite.config.js ./
COPY frontend/index.html ./
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/eslint.config.js ./

# 安裝所有依賴（包括 devDependencies，因為 vite 是開發依賴）
RUN npm ci

# 設定建置時的環境變數（使用 ARG 傳入）
ARG LIFF_CHANNEL_ID
ARG LINE_CHANNEL_SECRET
ARG LINE_CHANNEL_ACCESS_TOKEN
ARG VITE_API_BASE_URL

# 建置前端，環境變數會自動被 Vite 讀取
ENV LIFF_CHANNEL_ID=${LIFF_CHANNEL_ID}
ENV LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET}
ENV LINE_CHANNEL_ACCESS_TOKEN=${LINE_CHANNEL_ACCESS_TOKEN}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# 在 Docker 容器中建置到 dist 目錄
RUN npm run build -- --outDir ./dist

# ===============================================
# Stage 2: 建置 Python 後端
# ===============================================
FROM python:3.13 AS backend

# 設定工作目錄
WORKDIR /usr/src/app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 複製後端代碼
COPY app ./app
COPY requirements.txt ./
COPY entrypoint.sh ./
COPY wsgi.py ./
COPY migrations ./migrations

# 從前端建置階段複製建置結果
COPY --from=frontend-builder /app/frontend/dist ./app/static/dist

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r requirements.txt \
    && sed -i 's/\r$//' entrypoint.sh \
    && chmod +x entrypoint.sh

EXPOSE 5000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/v1/auth/container_health || exit 1

# 在開發環境中，啟動命令由 docker-compose.dev.yml 的 command 覆蓋
CMD ["gunicorn", "--worker-class", "gevent", "--workers", "1", "--bind", "0.0.0.0:5000", "wsgi:app"]
