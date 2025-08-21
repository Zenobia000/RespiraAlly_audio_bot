# services/web-app/app/middleware/error_handler.py
"""
統一的錯誤處理中間件
處理所有未捕獲的異常並返回統一格式的錯誤回應
"""
import logging
from flask import Flask, request
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from jwt import InvalidTokenError
from marshmallow import ValidationError as MarshmallowValidationError
from ..utils.response import (
    error_response,
    validation_error_response,
    not_found_response,
    unauthorized_response,
    forbidden_response,
    internal_error_response
)

logger = logging.getLogger(__name__)


def register_error_handlers(app: Flask):
    """
    註冊所有錯誤處理器到 Flask 應用
    
    Args:
        app: Flask 應用實例
    """
    
    @app.errorhandler(400)
    def bad_request_error(error):
        """處理 400 Bad Request 錯誤"""
        message = str(error.description) if hasattr(error, 'description') else "Bad request"
        return error_response(
            code="BAD_REQUEST",
            message=message,
            status_code=400
        )
    
    @app.errorhandler(401)
    def unauthorized_error(error):
        """處理 401 Unauthorized 錯誤"""
        message = str(error.description) if hasattr(error, 'description') else "Unauthorized access"
        return unauthorized_response(message)
    
    @app.errorhandler(403)
    def forbidden_error(error):
        """處理 403 Forbidden 錯誤"""
        message = str(error.description) if hasattr(error, 'description') else "Access forbidden"
        return forbidden_response(message)
    
    @app.errorhandler(404)
    def not_found_error(error):
        """處理 404 Not Found 錯誤"""
        return not_found_response("Resource")
    
    @app.errorhandler(405)
    def method_not_allowed_error(error):
        """處理 405 Method Not Allowed 錯誤"""
        return error_response(
            code="METHOD_NOT_ALLOWED",
            message=f"Method {request.method} is not allowed for this endpoint",
            status_code=405
        )
    
    @app.errorhandler(409)
    def conflict_error(error):
        """處理 409 Conflict 錯誤"""
        message = str(error.description) if hasattr(error, 'description') else "Conflict with current state"
        return error_response(
            code="CONFLICT",
            message=message,
            status_code=409
        )
    
    @app.errorhandler(422)
    def unprocessable_entity_error(error):
        """處理 422 Unprocessable Entity 錯誤"""
        if hasattr(error, 'data') and 'messages' in error.data:
            return validation_error_response(error.data['messages'])
        
        message = str(error.description) if hasattr(error, 'description') else "Unprocessable entity"
        return error_response(
            code="UNPROCESSABLE_ENTITY",
            message=message,
            status_code=422
        )
    
    @app.errorhandler(429)
    def too_many_requests_error(error):
        """處理 429 Too Many Requests 錯誤"""
        return error_response(
            code="TOO_MANY_REQUESTS",
            message="Too many requests. Please try again later.",
            status_code=429
        )
    
    @app.errorhandler(500)
    def internal_server_error(error):
        """處理 500 Internal Server Error 錯誤"""
        # 記錄錯誤詳情
        logger.error(f"Internal server error: {error}", exc_info=True)
        
        # 在開發環境中可以返回更詳細的錯誤資訊
        if app.config.get('DEBUG'):
            return internal_error_response(
                message=str(error),
                request_id=request.headers.get('X-Request-ID')
            )
        
        return internal_error_response(
            request_id=request.headers.get('X-Request-ID')
        )
    
    @app.errorhandler(503)
    def service_unavailable_error(error):
        """處理 503 Service Unavailable 錯誤"""
        return error_response(
            code="SERVICE_UNAVAILABLE",
            message="Service temporarily unavailable. Please try again later.",
            status_code=503
        )
    
    # ========== 處理特定異常類型 ==========
    
    @app.errorhandler(ValueError)
    def value_error_handler(error):
        """處理 ValueError"""
        return error_response(
            code="INVALID_VALUE",
            message=str(error),
            status_code=400
        )
    
    @app.errorhandler(KeyError)
    def key_error_handler(error):
        """處理 KeyError"""
        return error_response(
            code="MISSING_KEY",
            message=f"Missing required field: {str(error)}",
            status_code=400
        )
    
    @app.errorhandler(TypeError)
    def type_error_handler(error):
        """處理 TypeError"""
        return error_response(
            code="TYPE_ERROR",
            message=str(error),
            status_code=400
        )
    
    @app.errorhandler(SQLAlchemyError)
    def sqlalchemy_error_handler(error):
        """處理 SQLAlchemy 錯誤"""
        logger.error(f"Database error: {error}", exc_info=True)
        
        # 回滾資料庫會話
        from ..extensions import db
        db.session.rollback()
        
        # 在開發環境中返回詳細錯誤
        if app.config.get('DEBUG'):
            return error_response(
                code="DATABASE_ERROR",
                message=str(error),
                status_code=500
            )
        
        return internal_error_response(
            message="A database error occurred",
            request_id=request.headers.get('X-Request-ID')
        )
    
    @app.errorhandler(InvalidTokenError)
    def jwt_error_handler(error):
        """處理 JWT 錯誤"""
        return unauthorized_response(f"Invalid token: {str(error)}")
    
    @app.errorhandler(MarshmallowValidationError)
    def marshmallow_validation_error_handler(error):
        """處理 Marshmallow 驗證錯誤"""
        return validation_error_response(error.messages)
    
    @app.errorhandler(HTTPException)
    def http_exception_handler(error):
        """處理所有 HTTP 異常"""
        return error_response(
            code=error.name.upper().replace(' ', '_'),
            message=error.description,
            status_code=error.code
        )
    
    @app.errorhandler(Exception)
    def generic_exception_handler(error):
        """處理所有未捕獲的異常"""
        logger.error(f"Unhandled exception: {error}", exc_info=True)
        
        # 在開發環境中返回詳細錯誤
        if app.config.get('DEBUG'):
            return error_response(
                code="UNHANDLED_EXCEPTION",
                message=str(error),
                status_code=500,
                details={
                    "type": type(error).__name__,
                    "module": type(error).__module__
                }
            )
        
        return internal_error_response(
            request_id=request.headers.get('X-Request-ID')
        )
    
    # ========== 自定義錯誤類別 ==========
    
    @app.errorhandler(BusinessLogicError)
    def business_logic_error_handler(error):
        """處理業務邏輯錯誤"""
        return error_response(
            code=error.code,
            message=error.message,
            status_code=error.status_code,
            details=error.details
        )
    
    @app.errorhandler(ResourceNotFoundError)
    def resource_not_found_error_handler(error):
        """處理資源未找到錯誤"""
        return not_found_response(error.resource, error.identifier)
    
    @app.errorhandler(AuthenticationError)
    def authentication_error_handler(error):
        """處理認證錯誤"""
        return unauthorized_response(error.message)
    
    @app.errorhandler(AuthorizationError)
    def authorization_error_handler(error):
        """處理授權錯誤"""
        return forbidden_response(error.message)


# ========== 自定義異常類別 ==========

class AppError(Exception):
    """應用程式基礎異常類別"""
    
    def __init__(self, message: str = "An error occurred"):
        self.message = message
        super().__init__(self.message)


class BusinessLogicError(AppError):
    """業務邏輯錯誤"""
    
    def __init__(
        self,
        message: str,
        code: str = "BUSINESS_LOGIC_ERROR",
        status_code: int = 400,
        details: dict = None
    ):
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class ResourceNotFoundError(AppError):
    """資源未找到錯誤"""
    
    def __init__(self, resource: str = "Resource", identifier: str = None):
        self.resource = resource
        self.identifier = identifier
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with ID '{identifier}' not found"
        super().__init__(message)


class AuthenticationError(AppError):
    """認證錯誤"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message)


class AuthorizationError(AppError):
    """授權錯誤"""
    
    def __init__(self, message: str = "Authorization failed"):
        super().__init__(message)


class ValidationError(AppError):
    """驗證錯誤"""
    
    def __init__(self, message: str = "Validation failed", errors: dict = None):
        super().__init__(message)
        self.errors = errors or {}
