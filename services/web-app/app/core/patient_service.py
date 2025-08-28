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

def calculate_patient_kpis(patient_id, days=7):
    """
    計算個別病患的 KPI 指標
    
    Args:
        patient_id: 病患ID
        days: 計算天數範圍（默認7天）
        
    Returns:
        dict: 包含各種 KPI 指標的字典
    """
    try:
        from ..core.questionnaire_service import QuestionnaireService
        from ..core.daily_metric_service import DailyMetricService
        from datetime import datetime, timedelta
        
        # 服務實例
        q_service = QuestionnaireService()
        dm_service = DailyMetricService()
        
        # 計算日期範圍
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        # 1. 獲取最新問卷分數
        cat_history, _ = q_service.get_cat_history(patient_id, page=1, per_page=1)
        mmrc_history, _ = q_service.get_mmrc_history(patient_id, page=1, per_page=1)
        
        latest_cat = cat_history.items[0].total_score if cat_history and cat_history.items else 0
        latest_mmrc = mmrc_history.items[0].score if mmrc_history and mmrc_history.items else 0
        
        # 2. 獲取指定天數的每日記錄
        daily_metrics, _ = dm_service.get_daily_metrics(
            patient_id,
            start_date.isoformat(),
            end_date.isoformat(),
            page=1,
            per_page=days
        )
        
        metrics_list = daily_metrics.items if daily_metrics else []
        
        # 3. 計算依從性相關指標
        total_days = len(metrics_list)
        medication_taken_count = sum(1 for m in metrics_list if m.medication)
        adherence_rate = medication_taken_count / max(total_days, 1)
        
        # 報告率（實際記錄天數 / 總天數）
        report_rate = total_days / days
        
        # 完成度（基於多個指標的複合分數）
        completion_score = 0
        if metrics_list:
            # 計算各項指標的完整性
            water_records = sum(1 for m in metrics_list if m.water_cc and m.water_cc > 0)
            exercise_records = sum(1 for m in metrics_list if m.exercise_min and m.exercise_min > 0)
            completion_score = (water_records + exercise_records + medication_taken_count) / (3 * max(total_days, 1))
        
        # 最後記錄天數
        last_record_date = max([m.created_at.date() for m in metrics_list]) if metrics_list else None
        last_report_days = (end_date - last_record_date).days if last_record_date else 999
        
        return {
            "cat_latest": latest_cat,
            "mmrc_latest": latest_mmrc,
            "adherence_7d": round(adherence_rate, 3),
            "report_rate_7d": round(report_rate, 3),
            "completion_7d": round(completion_score, 3),
            "last_report_days": last_report_days,
            "risk_level": calculate_patient_risk(patient_id),
            "metrics_summary": {
                "total_records": total_days,
                "medication_taken_days": medication_taken_count,
                "avg_water_cc": round(sum(m.water_cc for m in metrics_list if m.water_cc) / max(total_days, 1), 0) if total_days > 0 else 0,
                "avg_exercise_min": round(sum(m.exercise_min for m in metrics_list if m.exercise_min) / max(total_days, 1), 0) if total_days > 0 else 0,
                "total_cigarettes": sum(m.cigarettes for m in metrics_list if m.cigarettes) if total_days > 0 else 0
            }
        }
        
    except Exception as e:
        import logging
        logging.error(f"Error calculating patient KPIs for patient {patient_id}: {e}", exc_info=True)
        # 返回安全的默認值
        return {
            "cat_latest": 0,
            "mmrc_latest": 0,
            "adherence_7d": 0.0,
            "report_rate_7d": 0.0,
            "completion_7d": 0.0,
            "last_report_days": 999,
            "risk_level": "low",
            "metrics_summary": {
                "total_records": 0,
                "medication_taken_days": 0,
                "avg_water_cc": 0,
                "avg_exercise_min": 0,
                "total_cigarettes": 0
            }
        }

def get_patient_profile(patient_id):
    """
    獲取單一病患的詳細檔案。
    """
    repo = PatientRepository()
    return repo.find_profile_by_user_id(patient_id)
