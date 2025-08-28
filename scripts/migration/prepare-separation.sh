#!/bin/bash

# 前後端分離目錄結構準備腳本
# 用途：建立新的目錄結構，為代碼遷移做準備
# 執行：bash scripts/migration/prepare-separation.sh

set -e  # 遇到錯誤立即停止

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 輔助函數
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 確認執行
echo "======================================"
echo "前後端分離目錄結構準備腳本"
echo "======================================"
echo ""
echo "此腳本將："
echo "1. 建立新的服務目錄結構"
echo "2. 準備配置文件模板"
echo "3. 不會修改現有的 services/web-app"
echo ""
read -p "確定要繼續嗎？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warn "操作已取消"
    exit 1
fi

# 檢查是否在專案根目錄
if [ ! -f "docker-compose.dev.yml" ]; then
    log_error "請在專案根目錄執行此腳本"
    exit 1
fi

log_info "開始建立目錄結構..."

# Phase 1: 建立後端服務目錄
log_info "建立 backend-api 目錄結構..."
mkdir -p services/backend-api/{app,tests,migrations,docs}
mkdir -p services/backend-api/app/{api/v1,core,models,middleware,utils}
mkdir -p services/backend-api/tests/{unit,integration}

# Phase 2: 建立前端服務目錄
log_info "建立 frontend-app 目錄結構..."
mkdir -p services/frontend-app/{src,public,tests,nginx}
mkdir -p services/frontend-app/src/{apps,services,shared,config}
mkdir -p services/frontend-app/src/apps/{dashboard,liff}
mkdir -p services/frontend-app/src/services/{api/endpoints}
mkdir -p services/frontend-app/tests/{unit,e2e}

# Phase 3: 建立共享目錄
log_info "建立 shared 目錄結構..."
mkdir -p services/shared/{types,contracts,scripts}

# Phase 4: 建立基礎設施目錄
log_info "建立基礎設施目錄結構..."
mkdir -p infra/docker/{compose,scripts}
mkdir -p infra/nginx/configs

# Phase 5: 建立文件目錄
log_info "建立文件目錄結構..."
mkdir -p docs/{architecture,api,deployment}

# Phase 6: 建立腳本目錄
log_info "建立腳本目錄結構..."
mkdir -p scripts/{dev,deploy,migration}

# Phase 7: 建立 CI/CD 目錄
log_info "建立 CI/CD 目錄結構..."
mkdir -p .github/workflows

# Phase 8: 建立 README 文件
log_info "建立 README 模板..."

# Backend README
cat > services/backend-api/README.md << 'EOF'
# Backend API Service

## 概述
RespiraAlly 後端 API 服務，提供 RESTful API 端點。

## 技術棧
- Python 3.11
- Flask 3.x
- PostgreSQL
- Redis
- Milvus

## 快速開始

### 開發環境
```bash
# 安裝依賴
pip install -r requirements-dev.txt

# 設定環境變數
cp .env.example .env

# 執行遷移
flask db upgrade

# 啟動服務
flask run --debug
```

### Docker 環境
```bash
docker-compose -f ../../infra/docker/compose/dev.yml up backend-api
```

## API 文件
訪問 `http://localhost:5000/api/docs` 查看 Swagger 文件

## 測試
```bash
# 單元測試
pytest tests/unit

# 整合測試
pytest tests/integration
```
EOF

# Frontend README
cat > services/frontend-app/README.md << 'EOF'
# Frontend Application

## 概述
RespiraAlly 前端應用，包含 Dashboard 和 LIFF 兩個子應用。

## 技術棧
- React 18
- Vite
- TypeScript
- Tailwind CSS
- Ant Design

## 快速開始

### 開發環境
```bash
# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env

# 啟動開發伺服器
npm run dev
```

### 生產構建
```bash
npm run build
```

### Docker 環境
```bash
docker-compose -f ../../infra/docker/compose/dev.yml up frontend-app
```

## 測試
```bash
# 單元測試
npm run test

# E2E 測試
npm run test:e2e
```
EOF

# Phase 9: 建立環境變數範例
log_info "建立環境變數範例..."

# Backend .env.example
cat > services/backend-api/.env.example << 'EOF'
# Flask Configuration
FLASK_APP=app
FLASK_ENV=development
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/respiraally
REDIS_URL=redis://localhost:6379

# Milvus
MILVUS_URI=http://localhost:19530

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ACCESS_TOKEN_EXPIRES=3600

# LINE API
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-access-token
EOF

# Frontend .env.example
cat > services/frontend-app/.env.example << 'EOF'
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api/v1

# LIFF Configuration
VITE_LIFF_ID=your-liff-id

# Feature Flags
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEBUG=true
EOF

# Phase 10: 建立 Docker 配置模板
log_info "建立 Docker 配置模板..."

# Backend Dockerfile
cat > services/backend-api/Dockerfile << 'EOF'
# Backend API Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Python 依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用代碼
COPY . .

# 健康檢查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

EXPOSE 5000

CMD ["gunicorn", "--worker-class", "gevent", "--workers", "2", "--bind", "0.0.0.0:5000", "wsgi:app"]
EOF

# Frontend Dockerfile
cat > services/frontend-app/Dockerfile << 'EOF'
# Frontend Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安裝依賴
COPY package*.json ./
RUN npm ci

# 構建應用
COPY . .
RUN npm run build

# 生產階段
FROM nginx:alpine

# 複製構建結果
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 nginx 配置
COPY nginx/default.conf /etc/nginx/conf.d/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# Frontend Dev Dockerfile
cat > services/frontend-app/Dockerfile.dev << 'EOF'
# Frontend Development Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安裝依賴
COPY package*.json ./
RUN npm ci

# 開發模式
EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
EOF

# Phase 11: 建立 Makefile
log_info "建立 Makefile..."

cat > Makefile << 'EOF'
# RespiraAlly Makefile
.PHONY: help dev prod test clean

# 預設目標
help:
	@echo "RespiraAlly 專案命令："
	@echo "  make dev      - 啟動開發環境"
	@echo "  make prod     - 啟動生產環境"
	@echo "  make test     - 執行所有測試"
	@echo "  make clean    - 清理容器和映像"
	@echo "  make migrate  - 執行資料庫遷移"
	@echo "  make logs     - 查看服務日誌"

# 開發環境
dev:
	docker-compose -f infra/docker/compose/base.yml \
	               -f infra/docker/compose/dev.yml up

dev-backend:
	docker-compose -f infra/docker/compose/base.yml \
	               -f infra/docker/compose/dev.yml up backend-api

dev-frontend:
	docker-compose -f infra/docker/compose/base.yml \
	               -f infra/docker/compose/dev.yml up frontend-app

# 生產環境
prod:
	docker-compose -f infra/docker/compose/base.yml \
	               -f infra/docker/compose/prod.yml up -d

# 測試
test:
	@echo "執行後端測試..."
	docker-compose run --rm backend-api pytest
	@echo "執行前端測試..."
	docker-compose run --rm frontend-app npm test

test-backend:
	docker-compose run --rm backend-api pytest

test-frontend:
	docker-compose run --rm frontend-app npm test

# 資料庫遷移
migrate:
	docker-compose run --rm backend-api flask db upgrade

# 清理
clean:
	docker-compose down -v
	docker system prune -f

# 日誌
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend-api

logs-frontend:
	docker-compose logs -f frontend-app
EOF

# 完成訊息
echo ""
log_info "目錄結構準備完成！"
echo ""
echo "已建立的結構："
echo "  ✅ services/backend-api/   - 後端 API 服務"
echo "  ✅ services/frontend-app/  - 前端應用服務"
echo "  ✅ services/shared/        - 共享資源"
echo "  ✅ infra/docker/           - Docker 配置"
echo "  ✅ docs/                   - 專案文件"
echo "  ✅ scripts/                - 工具腳本"
echo "  ✅ .github/workflows/      - CI/CD 配置"
echo "  ✅ Makefile                - 快捷命令"
echo ""
echo "下一步："
echo "1. 執行 scripts/migration/split-services.sh 遷移代碼"
echo "2. 更新 Docker Compose 配置"
echo "3. 測試新的服務結構"
echo ""
log_info "準備工作完成！"
