# services/web-app/app/middleware/monitoring.py
"""
📊 API 效能監控中間件模組

功能概述:
- 監控所有 API 請求的回應時間
- 記錄 API 效能指標與慢查詢警告
- 為每個請求添加 Request ID 追蹤
- 提供裝飾器用於特定路由的效能監控

資訊流:
Request → before_request() → API Logic → after_request() → Response
                ↓                                ↓
        記錄開始時間戳                      計算執行時間
                ↓                                ↓
        生成 Request ID                    記錄效能日誌

依賴關係:
- Flask (request, g): 請求上下文管理
- logging: 效能日誌記錄
- time: 時間測量

設計模式:
- 中間件模式 (Middleware Pattern): before_request/after_request 鉤子
- 裝飾器模式 (Decorator Pattern): performance_monitor 裝飾器
- 單例模式: 全局效能監控配置

使用方式:
1. 在 create_app() 中註冊: init_monitoring(app)
2. 對特定函數使用: @performance_monitor(threshold_seconds=2.0)

效能標準:
- 正常: < 1s (INFO)
- 警告: 1-2s (WARNING)
- 慢查詢: > 2s (WARNING + SLOW_API 標記)
"""
import time
import logging
from flask import request, g
from functools import wraps

logger = logging.getLogger(__name__)

def init_monitoring(app):
    """初始化 API 效能監控"""
    
    @app.before_request
    def before_request():
        """請求開始時記錄時間戳"""
        g.start_time = time.time()
        g.request_id = request.headers.get('X-Request-Id', f'req_{int(time.time() * 1000)}')
    
    @app.after_request
    def after_request(response):
        """請求結束後記錄效能指標"""
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            
            # 添加效能標頭
            response.headers['X-Request-Id'] = getattr(g, 'request_id', '')
            response.headers['X-Response-Time'] = f'{duration:.3f}s'
            
            # 記錄效能日誌
            log_api_metrics(request, response, duration)
            
        return response

def log_api_metrics(request, response, duration):
    """記錄 API 效能指標"""
    # 只記錄 API 路由
    if not request.path.startswith('/api/'):
        return
    
    status_code = response.status_code
    method = request.method
    path = request.path
    
    # 效能日誌
    log_level = logging.WARNING if duration > 1.0 else logging.INFO
    logger.log(log_level, f"API_METRICS: {method} {path} {status_code} {duration:.3f}s")
    
    # 慢查詢警告
    if duration > 2.0:
        logger.warning(f"SLOW_API: {method} {path} took {duration:.3f}s (>2s threshold)")

def performance_monitor(threshold_seconds=1.0):
    """裝飾器：監控特定路由的效能"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = f(*args, **kwargs)
                duration = time.time() - start_time
                
                if duration > threshold_seconds:
                    logger.warning(f"PERFORMANCE: {f.__name__} took {duration:.3f}s")
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                logger.error(f"ERROR: {f.__name__} failed after {duration:.3f}s: {e}")
                raise
        return wrapper
    return decorator