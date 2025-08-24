# services/web-app/app/api/patients.py
from flask import Blueprint, request, jsonify
from flasgger import swag_from
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..core import patient_service
from ..core.user_repository import UserRepository

patients_bp = Blueprint('patients', __name__, url_prefix='/api/v1')

@patients_bp.route('/therapist/patients', methods=['GET'])
@jwt_required()
@swag_from({
    'summary': '獲取管理的病患列表',
    'description': '獲取當前登入的呼吸治療師所管理的所有病患的簡要列表，支援風險篩選和分頁。',
    'tags': ['Patients'],
    'security': [{'bearerAuth': []}],
    'parameters': [
        {'name': 'page', 'in': 'query', 'type': 'integer', 'default': 1, 'description': '頁碼'},
        {'name': 'per_page', 'in': 'query', 'type': 'integer', 'default': 20, 'description': '每頁數量'},
        {'name': 'risk', 'in': 'query', 'type': 'string', 'enum': ['high', 'medium', 'low'], 'description': '風險等級篩選'},
        {'name': 'limit', 'in': 'query', 'type': 'integer', 'description': '限制返回數量（覆蓋per_page）'},
        {'name': 'sort_by', 'in': 'query', 'type': 'string', 'default': 'created_at', 'description': '排序欄位'},
        {'name': 'order', 'in': 'query', 'type': 'string', 'default': 'desc', 'enum': ['asc', 'desc'], 'description': '排序順序'}
    ],
    'responses': {
        '200': {'description': '成功獲取病患列表'},
        '400': {'description': '參數驗證失敗'},
        '401': {'description': 'Token 無效或未提供'},
        '403': {'description': '沒有治療師權限'}
    }
})
def get_therapist_patients():
    """獲取治療師的病患列表，支援風險篩選和分頁"""
    current_user_id = get_jwt_identity()
    user_repo = UserRepository()
    current_user = user_repo.find_by_id(current_user_id)

    if not current_user or not current_user.is_staff:
        return jsonify({"error": {"code": "PERMISSION_DENIED", "message": "Staff access required"}}), 403

    # 1. 參數獲取
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    risk = request.args.get('risk', type=str)
    limit = request.args.get('limit', type=int)
    sort_by = request.args.get('sort_by', 'created_at', type=str)
    order = request.args.get('order', 'desc', type=str)

    # 2. 參數驗證
    validation_errors = []
    
    # 處理 risk 參數：過濾掉 undefined、null、空字串等無效值
    if risk and str(risk).strip() and str(risk).lower() not in ['undefined', 'null', 'none', '']:
        risk_lower = str(risk).lower()
        if risk_lower not in ['high', 'medium', 'low']:
            validation_errors.append("Invalid risk level. Must be 'high', 'medium', or 'low'")
        else:
            risk = risk_lower  # 標準化為小寫
    else:
        risk = None  # 將無效值設為 None
    
    # 處理 limit 參數：過濾掉無效值
    if limit is not None and limit > 0 and limit <= 100:
        pass  # limit 有效
    elif limit is not None:  # 如果提供了 limit 但值無效
        validation_errors.append("Invalid limit. Must be between 1 and 100")
        limit = None  # 將無效值設為 None
    
    # 處理 page 和 per_page 參數
    if page <= 0:
        validation_errors.append("Page must be greater than 0")
    
    if per_page <= 0 or per_page > 100:
        validation_errors.append("Per page must be between 1 and 100")
    
    if validation_errors:
        return jsonify({
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "; ".join(validation_errors),
                "details": validation_errors
            }
        }), 400

    # 3. 調用服務層
    try:
        paginated_data = patient_service.get_patients_by_therapist(
            therapist_id=current_user.id,
            page=page,
            per_page=per_page,
            risk=risk,
            limit=limit,
            sort_by=sort_by,
            order=order
        )
    except Exception as e:
        return jsonify({
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Failed to retrieve patients data"
            }
        }), 500

    # 4. 格式化回傳的資料
    patient_list = []
    for user, health_profile in paginated_data.items:
        # 計算風險等級用於顯示
        risk_level = patient_service.calculate_patient_risk(user.id)
        
        patient_info = {
            "user_id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "gender": user.gender,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "risk_level": risk_level,
            # TODO: 待問卷模型完成後，補上 last_cat_score 和 last_mmrc_score
            "last_cat_score": None,
            "last_mmrc_score": None
        }
        patient_list.append(patient_info)

    # 5. 返回結果
    response_data = {
        "data": patient_list,
        "pagination": {
            "total_items": paginated_data.total,
            "total_pages": paginated_data.pages,
            "current_page": paginated_data.page,
            "per_page": paginated_data.per_page,
            "has_next": hasattr(paginated_data, 'has_next') and paginated_data.has_next,
            "has_prev": hasattr(paginated_data, 'has_prev') and paginated_data.has_prev
        },
        "filters": {
            "risk": risk,
            "limit": limit,
            "sort_by": sort_by,
            "order": order
        }
    }

    return jsonify(response_data), 200

@patients_bp.route('/patients/<int:patient_id>/profile', methods=['GET'])
@jwt_required()
@swag_from({
    'summary': '獲取病患詳細健康檔案',
    'description': '獲取指定病患的詳細健康檔案資訊。',
    'tags': ['Patients'],
    'security': [{'bearerAuth': []}],
    'parameters': [
        {'name': 'patient_id', 'in': 'path', 'type': 'integer', 'required': True, 'description': '病患的 user_id'}
    ],
    'responses': {
        '200': {'description': '成功獲取病患檔案'},
        '401': {'description': 'Token 無效或未提供'},
        '403': {'description': '沒有權限查看此病患'},
        '404': {'description': '找不到該病患'}
    }
})
def get_patient_profile(patient_id):
    """獲取病患詳細健康檔案"""
    current_user_id = get_jwt_identity()
    user_repo = UserRepository()
    current_user = user_repo.find_by_id(current_user_id)

    if not current_user or not current_user.is_staff:
        return jsonify({"error": {"code": "PERMISSION_DENIED", "message": "Staff access required"}}), 403

    profile_data = patient_service.get_patient_profile(patient_id)

    if not profile_data:
        return jsonify({"error": {"code": "RESOURCE_NOT_FOUND", "message": "Patient not found"}}), 404

    user, health_profile = profile_data

    # 權限校驗：確保當前治療師是該病患的個管師
    if health_profile.staff_id != current_user.id:
        return jsonify({"error": {"code": "PERMISSION_DENIED", "message": "You are not authorized to view this patient's profile"}}), 403

    # 格式化回傳資料
    response_data = {
        "user_id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "gender": user.gender,
        "email": user.email,
        "phone": user.phone,
        "health_profile": {
            "height_cm": health_profile.height_cm,
            "weight_kg": health_profile.weight_kg,
            "smoke_status": health_profile.smoke_status,
            "updated_at": health_profile.updated_at.isoformat() if health_profile.updated_at else None
        }
    }

    return jsonify({"data": response_data}), 200

@patients_bp.route('/patients', methods=['GET'])
@jwt_required()
def get_patients_generic():
    """
    統一的病患查詢端點，用於捕獲錯誤調用並重定向到正確的端點
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # 記錄調用信息
    logger.warning(f"錯誤的API調用: /api/v1/patients 被調用，參數: {dict(request.args)}")
    logger.warning(f"請求來源: {request.headers.get('Referer', 'Unknown')}")
    logger.warning(f"用戶代理: {request.headers.get('User-Agent', 'Unknown')}")
    
    # 獲取當前用戶
    current_user_id = get_jwt_identity()
    user_repo = UserRepository()
    current_user = user_repo.find_by_id(current_user_id)
    
    if not current_user or not current_user.is_staff:
        return jsonify({"error": {"code": "PERMISSION_DENIED", "message": "Staff access required"}}), 403
    
    # 重定向到正確的端點
    return jsonify({
        "error": {
            "code": "ENDPOINT_DEPRECATED",
            "message": "This endpoint is deprecated. Please use /api/v1/therapist/patients instead.",
            "redirect_to": "/api/v1/therapist/patients",
            "current_params": dict(request.args)
        }
    }), 308  # 308 Permanent Redirect
