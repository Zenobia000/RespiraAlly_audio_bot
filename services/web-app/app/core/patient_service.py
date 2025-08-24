# services/web-app/app/core/patient_service.py
from .patient_repository import PatientRepository
from sqlalchemy import text
from ..extensions import db

def get_patients_by_therapist(therapist_id, page=1, per_page=20, sort_by='created_at', order='desc', risk=None, limit=None):
    """
    獲取治療師管理的病患列表，支援風險篩選和分頁。
    
    Args:
        therapist_id: 治療師ID
        page: 頁碼
        per_page: 每頁數量
        sort_by: 排序欄位
        order: 排序順序
        risk: 風險等級篩選 ('high', 'medium', 'low')
        limit: 限制返回數量
    """
    repo = PatientRepository()
    
    # 如果指定了limit，覆蓋per_page
    if limit:
        per_page = limit
    
    # 獲取基礎病患列表
    paginated_patients = repo.find_all_by_therapist_id(
        therapist_id=therapist_id,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        order=order
    )
    
    # 如果沒有風險篩選，直接返回
    if not risk:
        return paginated_patients
    
    # 應用風險篩選
    filtered_patients = []
    try:
        for user, health_profile in paginated_patients.items:
            try:
                # 計算風險等級
                risk_level = calculate_patient_risk(user.id)
                
                # 根據風險等級篩選
                if risk == 'high' and risk_level == 'high':
                    filtered_patients.append((user, health_profile))
                elif risk == 'medium' and risk_level == 'medium':
                    filtered_patients.append((user, health_profile))
                elif risk == 'low' and risk_level == 'low':
                    filtered_patients.append((user, health_profile))
            except Exception as e:
                print(f"處理用戶 {user.id} 風險篩選時發生錯誤: {e}")
                # 如果單個用戶處理失敗，仍然繼續處理其他用戶
                continue
        
        # 更新分頁資訊
        paginated_patients.items = filtered_patients
        paginated_patients.total = len(filtered_patients)
        paginated_patients.pages = (len(filtered_patients) + per_page - 1) // per_page
        
    except Exception as e:
        print(f"風險篩選過程中發生錯誤: {e}")
        # 如果風險篩選失敗，返回原始結果
        pass
    
    return paginated_patients

def calculate_patient_risk(user_id):
    """
    計算病患的風險等級。
    
    Args:
        user_id: 病患ID
        
    Returns:
        str: 'high', 'medium', 或 'low'
    """
    try:
        # 使用 Flask-SQLAlchemy 的 session 方式
        result = db.session.execute(text("""
            SELECT 
                COALESCE(MAX(cat.total_score), 0) as cat_score,
                COALESCE(MAX(mmrc.score), 0) as mmrc_score
            FROM users u
            LEFT JOIN questionnaire_cat cat ON u.id = cat.user_id
            LEFT JOIN questionnaire_mmrc mmrc ON u.id = mmrc.user_id
            WHERE u.id = :user_id
            GROUP BY u.id
        """), {"user_id": user_id})
        
        row = result.fetchone()
        if row:
            cat_score = row[0] or 0
            mmrc_score = row[1] or 0
            
            # 風險等級判斷
            if cat_score >= 20 or mmrc_score >= 3:
                return 'high'
            elif cat_score >= 10 or mmrc_score >= 2:
                return 'medium'
            else:
                return 'low'
        
        return 'low'  # 預設低風險
        
    except Exception as e:
        print(f"計算風險等級失敗: {e}")
        return 'low'

def get_patient_profile(patient_id):
    """
    獲取單一病患的詳細檔案。
    """
    repo = PatientRepository()
    return repo.find_profile_by_user_id(patient_id)
