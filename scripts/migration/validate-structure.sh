#!/bin/bash

# 目錄結構驗證腳本
# 用途：驗證前後端分離後的目錄結構是否正確
# 執行：bash scripts/migration/validate-structure.sh

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 計數器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# 輔助函數
check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

check_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

check_file() {
    if [ -f "$1" ]; then
        check_pass "$2"
        return 0
    else
        check_fail "$2"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        check_pass "$2"
        return 0
    else
        check_fail "$2"
        return 1
    fi
}

# 標題
echo "======================================"
echo "前後端分離目錄結構驗證"
echo "======================================"
echo ""

# ===================================
# 檢查後端結構
# ===================================
echo -e "${BLUE}[後端服務檢查]${NC}"

# 核心目錄
check_dir "services/backend-api" "後端根目錄存在"
check_dir "services/backend-api/app" "Flask 應用目錄存在"
check_dir "services/backend-api/app/api" "API 路由目錄存在"
check_dir "services/backend-api/app/core" "業務邏輯目錄存在"
check_dir "services/backend-api/app/models" "資料模型目錄存在"
check_dir "services/backend-api/tests" "測試目錄存在"
check_dir "services/backend-api/migrations" "資料庫遷移目錄存在"

# 核心文件
check_file "services/backend-api/requirements.txt" "Python 依賴文件存在"
check_file "services/backend-api/Dockerfile" "Docker 配置存在"
check_file "services/backend-api/README.md" "README 文件存在"

# 應用文件檢查
if [ -f "services/backend-api/app/__init__.py" ] || [ -f "services/backend-api/app/app.py" ]; then
    check_pass "Flask 應用入口存在"
else
    check_fail "Flask 應用入口存在"
fi

# 配置文件
if [ -f "services/backend-api/app/config.py" ] || [ -f "services/backend-api/config.py" ]; then
    check_pass "配置文件存在"
else
    check_warn "配置文件可能需要調整"
fi

echo ""

# ===================================
# 檢查前端結構
# ===================================
echo -e "${BLUE}[前端服務檢查]${NC}"

# 核心目錄
check_dir "services/frontend-app" "前端根目錄存在"
check_dir "services/frontend-app/src" "源碼目錄存在"
check_dir "services/frontend-app/public" "公開資源目錄存在"
check_dir "services/frontend-app/src/apps" "應用模組目錄存在"
check_dir "services/frontend-app/src/services" "服務目錄存在"
check_dir "services/frontend-app/nginx" "Nginx 配置目錄存在"

# 核心文件
check_file "services/frontend-app/package.json" "NPM 配置文件存在"
check_file "services/frontend-app/vite.config.js" "Vite 配置存在"
check_file "services/frontend-app/index.html" "HTML 入口存在"
check_file "services/frontend-app/Dockerfile" "Docker 配置存在"
check_file "services/frontend-app/Dockerfile.dev" "開發 Docker 配置存在"
check_file "services/frontend-app/README.md" "README 文件存在"

# Nginx 配置
check_file "services/frontend-app/nginx/default.conf" "Nginx 配置存在"

# 應用入口
if [ -f "services/frontend-app/src/main.jsx" ] || [ -f "services/frontend-app/src/main.tsx" ] || [ -f "services/frontend-app/src/index.jsx" ]; then
    check_pass "React 應用入口存在"
else
    check_fail "React 應用入口存在"
fi

echo ""

# ===================================
# 檢查基礎設施
# ===================================
echo -e "${BLUE}[基礎設施檢查]${NC}"

# Docker 配置
check_dir "infra/docker" "Docker 配置目錄存在"
check_dir "infra/docker/compose" "Docker Compose 目錄存在"
check_file "infra/docker/compose/base.yml" "基礎服務配置存在"
check_file "infra/docker/compose/dev.yml" "開發環境配置存在"

# Nginx 配置
check_dir "infra/nginx" "Nginx 目錄存在"
check_dir "infra/nginx/configs" "Nginx 配置目錄存在"
check_file "infra/nginx/configs/api.conf" "API 路由配置存在"
check_file "infra/nginx/configs/app.conf" "前端路由配置存在"

echo ""

# ===================================
# 檢查輔助文件
# ===================================
echo -e "${BLUE}[輔助文件檢查]${NC}"

# 腳本
check_dir "scripts" "腳本目錄存在"
check_dir "scripts/dev" "開發腳本目錄存在"
check_dir "scripts/migration" "遷移腳本目錄存在"

# Makefile
check_file "Makefile" "Makefile 存在"

# 文件
check_dir "docs" "文件目錄存在"

echo ""

# ===================================
# 檢查依賴完整性
# ===================================
echo -e "${BLUE}[依賴檢查]${NC}"

# 檢查後端依賴
if [ -f "services/backend-api/requirements.txt" ]; then
    # 檢查關鍵依賴
    if grep -q "flask" services/backend-api/requirements.txt; then
        check_pass "Flask 依賴已定義"
    else
        check_warn "Flask 依賴未找到"
    fi
    
    if grep -q "sqlalchemy" services/backend-api/requirements.txt; then
        check_pass "SQLAlchemy 依賴已定義"
    else
        check_warn "SQLAlchemy 依賴未找到"
    fi
fi

# 檢查前端依賴
if [ -f "services/frontend-app/package.json" ]; then
    # 檢查關鍵依賴
    if grep -q '"react"' services/frontend-app/package.json; then
        check_pass "React 依賴已定義"
    else
        check_warn "React 依賴未找到"
    fi
    
    if grep -q '"vite"' services/frontend-app/package.json; then
        check_pass "Vite 依賴已定義"
    else
        check_warn "Vite 依賴未找到"
    fi
fi

echo ""

# ===================================
# 可選檢查
# ===================================
echo -e "${BLUE}[可選配置檢查]${NC}"

# 環境變數範例
if [ -f "services/backend-api/.env.example" ]; then
    check_pass "後端環境變數範例存在"
else
    check_warn "建議添加後端環境變數範例"
fi

if [ -f "services/frontend-app/.env.example" ]; then
    check_pass "前端環境變數範例存在"
else
    check_warn "建議添加前端環境變數範例"
fi

# CI/CD 配置
if [ -d ".github/workflows" ]; then
    check_pass "GitHub Actions 目錄存在"
else
    check_warn "建議配置 CI/CD"
fi

echo ""

# ===================================
# 結果總結
# ===================================
echo "======================================"
echo -e "${BLUE}驗證結果總結${NC}"
echo "======================================"
echo ""
echo -e "總檢查項目: ${TOTAL_CHECKS}"
echo -e "${GREEN}通過: ${PASSED_CHECKS}${NC}"
echo -e "${RED}失敗: ${FAILED_CHECKS}${NC}"
echo -e "${YELLOW}警告: ${WARNINGS}${NC}"
echo ""

# 計算通過率
if [ $TOTAL_CHECKS -gt 0 ]; then
    PASS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "通過率: ${PASS_RATE}%"
else
    PASS_RATE=0
fi

echo ""

# 給出建議
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ 目錄結構驗證完全通過！${NC}"
    echo ""
    echo "下一步建議："
    echo "1. 執行 'make dev' 啟動開發環境"
    echo "2. 訪問 http://localhost:3000 測試前端"
    echo "3. 訪問 http://localhost:5000/api/docs 查看 API 文件"
elif [ $PASS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠ 目錄結構基本完成，但有些項目需要注意${NC}"
    echo ""
    echo "建議："
    echo "1. 檢查失敗的項目並修復"
    echo "2. 執行 scripts/migration/split-services.sh 補充缺失文件"
else
    echo -e "${RED}✗ 目錄結構不完整，需要進一步設置${NC}"
    echo ""
    echo "建議："
    echo "1. 執行 scripts/migration/prepare-separation.sh 建立基礎結構"
    echo "2. 執行 scripts/migration/split-services.sh 遷移代碼"
    echo "3. 重新執行此驗證腳本"
fi

echo ""

# 檢查是否可以啟動服務
if [ $FAILED_CHECKS -eq 0 ] || [ $PASS_RATE -ge 90 ]; then
    echo "======================================"
    echo -e "${BLUE}服務啟動檢查${NC}"
    echo "======================================"
    echo ""
    
    # 檢查 Docker
    if command -v docker &> /dev/null; then
        check_pass "Docker 已安裝"
        
        # 檢查 Docker Compose
        if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
            check_pass "Docker Compose 已安裝"
            echo ""
            echo -e "${GREEN}環境已就緒，可以啟動服務${NC}"
            echo ""
            echo "啟動命令："
            echo "  cd infra/docker/compose"
            echo "  docker-compose -f base.yml -f dev.yml up"
            echo ""
            echo "或使用："
            echo "  make dev"
        else
            check_fail "Docker Compose 未安裝"
        fi
    else
        check_fail "Docker 未安裝"
    fi
fi

# 退出碼
if [ $FAILED_CHECKS -eq 0 ]; then
    exit 0
else
    exit 1
fi
