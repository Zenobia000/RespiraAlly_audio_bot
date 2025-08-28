#!/bin/bash

# 前後端代碼分離遷移腳本
# 用途：將 services/web-app 的代碼分離到 backend-api 和 frontend-app
# 執行：bash scripts/migration/split-services.sh

set -e  # 遇到錯誤立即停止

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 確認執行
echo "======================================"
echo "前後端代碼分離遷移腳本"
echo "======================================"
echo ""
echo "此腳本將："
echo "1. 複製後端代碼到 services/backend-api"
echo "2. 複製前端代碼到 services/frontend-app"
echo "3. 調整必要的配置文件"
echo "4. 保留原始 services/web-app 不變"
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

# 檢查目標目錄是否已存在內容
if [ -d "services/backend-api/app" ] && [ "$(ls -A services/backend-api/app)" ]; then
    log_warn "services/backend-api/app 已存在內容"
    read -p "是否覆蓋？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "跳過後端遷移"
        SKIP_BACKEND=true
    fi
fi

if [ -d "services/frontend-app/src" ] && [ "$(ls -A services/frontend-app/src)" ]; then
    log_warn "services/frontend-app/src 已存在內容"
    read -p "是否覆蓋？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "跳過前端遷移"
        SKIP_FRONTEND=true
    fi
fi

# ===================================
# Phase 1: 遷移後端代碼
# ===================================
if [ -z "$SKIP_BACKEND" ]; then
    log_step "開始遷移後端代碼..."
    
    # 複製核心應用代碼
    log_info "複製 Flask 應用..."
    cp -r services/web-app/app/* services/backend-api/app/ 2>/dev/null || true
    
    # 複製測試
    log_info "複製測試文件..."
    cp -r services/web-app/tests/* services/backend-api/tests/ 2>/dev/null || true
    
    # 複製資料庫遷移
    log_info "複製資料庫遷移..."
    cp -r services/web-app/migrations/* services/backend-api/migrations/ 2>/dev/null || true
    
    # 複製 Python 相關文件
    log_info "複製 Python 配置文件..."
    cp services/web-app/requirements.txt services/backend-api/ 2>/dev/null || true
    cp services/web-app/wsgi.py services/backend-api/ 2>/dev/null || true
    cp services/web-app/entrypoint.sh services/backend-api/ 2>/dev/null || true
    
    # 建立開發依賴文件
    log_info "建立開發依賴文件..."
    cat > services/backend-api/requirements-dev.txt << 'EOF'
# Development dependencies
-r requirements.txt

# Testing
pytest==7.4.0
pytest-cov==4.1.0
pytest-flask==1.2.0
pytest-mock==3.11.1

# Code quality
black==23.7.0
flake8==6.0.0
isort==5.12.0
mypy==1.4.1

# Debugging
ipdb==0.13.13
flask-debugtoolbar==0.13.1
EOF
    
    # 移除前端相關文件
    log_info "清理前端相關文件..."
    rm -rf services/backend-api/app/static/dist 2>/dev/null || true
    rm -rf services/backend-api/app/static/assets 2>/dev/null || true
    
    # 調整 Flask 應用配置
    log_info "調整 Flask 應用配置..."
    cat > services/backend-api/app/config.py << 'EOF'
import os
from datetime import timedelta

class Config:
    """基礎配置"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS (開發環境允許前端訪問)
    CORS_ORIGINS = []
    
    # Milvus
    MILVUS_URI = os.getenv('MILVUS_URI', 'http://localhost:19530')
    
    # OpenAI
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

class DevelopmentConfig(Config):
    """開發環境配置"""
    DEBUG = True
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5173']

class ProductionConfig(Config):
    """生產環境配置"""
    DEBUG = False
    # 生產環境的 CORS 會由 nginx 處理

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
EOF

    # 建立 wsgi.py（如果不存在）
    if [ ! -f "services/backend-api/wsgi.py" ]; then
        log_info "建立 wsgi.py..."
        cat > services/backend-api/wsgi.py << 'EOF'
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run()
EOF
    fi
    
    log_info "後端代碼遷移完成！"
fi

# ===================================
# Phase 2: 遷移前端代碼
# ===================================
if [ -z "$SKIP_FRONTEND" ]; then
    log_step "開始遷移前端代碼..."
    
    # 複製所有前端文件
    log_info "複製前端源碼..."
    cp -r services/web-app/frontend/src/* services/frontend-app/src/ 2>/dev/null || true
    cp -r services/web-app/frontend/public/* services/frontend-app/public/ 2>/dev/null || true
    
    # 複製前端配置文件
    log_info "複製前端配置文件..."
    cp services/web-app/frontend/package.json services/frontend-app/ 2>/dev/null || true
    cp services/web-app/frontend/package-lock.json services/frontend-app/ 2>/dev/null || true
    cp services/web-app/frontend/vite.config.js services/frontend-app/ 2>/dev/null || true
    cp services/web-app/frontend/index.html services/frontend-app/ 2>/dev/null || true
    cp services/web-app/frontend/eslint.config.js services/frontend-app/ 2>/dev/null || true
    cp services/web-app/frontend/.env.example services/frontend-app/ 2>/dev/null || true
    
    # 調整 vite.config.js 以適應新結構
    log_info "調整 Vite 配置..."
    cat > services/frontend-app/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://backend-api:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['antd', '@ant-design/icons'],
          charts: ['chart.js', 'react-chartjs-2'],
        },
      },
    },
  },
})
EOF
    
    # 建立 nginx 配置
    log_info "建立 nginx 配置..."
    cat > services/frontend-app/nginx/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 靜態資源快取
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 安全標頭
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
    
    log_info "前端代碼遷移完成！"
fi

# ===================================
# Phase 3: 建立 Docker Compose 配置
# ===================================
log_step "建立 Docker Compose 配置..."

# Base services
log_info "建立基礎服務配置..."
cat > infra/docker/compose/base.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: postgres_db
    environment:
      POSTGRES_USER: ${POSTGRES_ADMIN_USER}
      POSTGRES_PASSWORD: ${POSTGRES_ADMIN_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_ADMIN_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - respiraally_network

  redis:
    image: redis:7-alpine
    container_name: redis_cache
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - respiraally_network

  milvus:
    image: milvusdb/milvus:v2.3.0
    container_name: milvus_vector_db
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - milvus_data:/var/lib/milvus
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9091/healthz"]
      interval: 10s
      timeout: 5s
      retries: 12
    networks:
      - respiraally_network

volumes:
  postgres_data:
  redis_data:
  milvus_data:

networks:
  respiraally_network:
    driver: bridge
EOF

# Development services
log_info "建立開發環境配置..."
cat > infra/docker/compose/dev.yml << 'EOF'
version: '3.8'

services:
  backend-api:
    build:
      context: ../../../services/backend-api
      dockerfile: Dockerfile
    container_name: dev_backend_api
    volumes:
      - ../../../services/backend-api:/app
      - /app/__pycache__
    environment:
      FLASK_ENV: development
      DATABASE_URL: postgresql://${POSTGRES_ADMIN_USER}:${POSTGRES_ADMIN_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      MILVUS_URI: http://milvus:19530
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - respiraally_network
    command: flask run --host=0.0.0.0 --port=5000 --debug

  frontend-app:
    build:
      context: ../../../services/frontend-app
      dockerfile: Dockerfile.dev
    container_name: dev_frontend_app
    volumes:
      - ../../../services/frontend-app:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
      VITE_API_BASE_URL: http://backend-api:5000
    ports:
      - "3000:3000"
    depends_on:
      - backend-api
    networks:
      - respiraally_network
    command: npm run dev

  nginx:
    image: nginx:alpine
    container_name: dev_nginx
    volumes:
      - ../../../infra/nginx/configs:/etc/nginx/conf.d
    ports:
      - "80:80"
    depends_on:
      - backend-api
      - frontend-app
    networks:
      - respiraally_network
EOF

# ===================================
# Phase 4: 建立輔助腳本
# ===================================
log_step "建立輔助腳本..."

# 開發環境啟動腳本
log_info "建立開發環境啟動腳本..."
cat > scripts/dev/start.sh << 'EOF'
#!/bin/bash
# 啟動開發環境

cd "$(dirname "$0")/../.."

echo "啟動開發環境..."
docker-compose -f infra/docker/compose/base.yml \
               -f infra/docker/compose/dev.yml up
EOF
chmod +x scripts/dev/start.sh

# 後端獨立啟動腳本
cat > scripts/dev/start-backend.sh << 'EOF'
#!/bin/bash
# 獨立啟動後端

cd "$(dirname "$0")/../../services/backend-api"

# 啟動虛擬環境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 載入環境變數
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 啟動 Flask
flask run --host=0.0.0.0 --port=5000 --debug
EOF
chmod +x scripts/dev/start-backend.sh

# 前端獨立啟動腳本
cat > scripts/dev/start-frontend.sh << 'EOF'
#!/bin/bash
# 獨立啟動前端

cd "$(dirname "$0")/../../services/frontend-app"

# 安裝依賴（如果需要）
if [ ! -d "node_modules" ]; then
    echo "安裝依賴..."
    npm install
fi

# 啟動開發伺服器
npm run dev
EOF
chmod +x scripts/dev/start-frontend.sh

# ===================================
# Phase 5: 建立 nginx 路由配置
# ===================================
log_step "建立 nginx 路由配置..."

# API 路由配置
cat > infra/nginx/configs/api.conf << 'EOF'
# API 路由配置
upstream backend_api {
    server backend-api:5000;
}

location /api/ {
    proxy_pass http://backend_api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket 支援
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # 超時設定
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

location /api/docs {
    proxy_pass http://backend_api/api/docs;
    proxy_set_header Host $host;
}
EOF

# 前端路由配置
cat > infra/nginx/configs/app.conf << 'EOF'
# 前端應用路由配置
upstream frontend_app {
    server frontend-app:3000;
}

location / {
    proxy_pass http://frontend_app;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket 支援（開發環境 HMR）
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# 靜態資源
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    proxy_pass http://frontend_app;
    expires 1h;
    add_header Cache-Control "public";
}
EOF

# 主配置
cat > infra/nginx/configs/default.conf << 'EOF'
# Nginx 主配置
server {
    listen 80;
    server_name _;
    
    # 引入路由配置
    include /etc/nginx/conf.d/api.conf;
    include /etc/nginx/conf.d/app.conf;
    
    # 健康檢查端點
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# ===================================
# 完成訊息
# ===================================
echo ""
log_info "代碼分離遷移完成！"
echo ""
echo "已完成的工作："
echo "  ✅ 後端代碼遷移到 services/backend-api/"
echo "  ✅ 前端代碼遷移到 services/frontend-app/"
echo "  ✅ Docker Compose 配置建立"
echo "  ✅ Nginx 路由配置建立"
echo "  ✅ 輔助腳本建立"
echo ""
echo "下一步操作："
echo ""
echo "1. 測試新結構："
echo "   cd infra/docker/compose"
echo "   docker-compose -f base.yml -f dev.yml up"
echo ""
echo "2. 或使用 Makefile："
echo "   make dev"
echo ""
echo "3. 訪問服務："
echo "   - 前端: http://localhost:3000"
echo "   - 後端 API: http://localhost:5000"
echo "   - 統一入口: http://localhost:80"
echo ""
log_warn "注意：原始 services/web-app 保持不變，可作為備份"
log_info "遷移完成！"
