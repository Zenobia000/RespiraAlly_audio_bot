"""add performance indexes and default values

Revision ID: 387f70adbe60
Revises: c03e8c9c3b97
Create Date: 2025-08-17 01:59:39.194849

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '387f70adbe60'
down_revision = 'c03e8c9c3b97'
branch_labels = None
depends_on = None


def upgrade():
    # ### 新增 tasks 表的效能索引 ###
    
    # 治療師任務狀態複合索引 - 高頻查詢優化
    op.create_index('idx_tasks_assignee_status', 'tasks', ['assignee_id', 'status'])
    
    # 到期日索引 - 任務排程與逾期查詢
    op.create_index('idx_tasks_due_date', 'tasks', ['due_date'])
    
    # 病患任務索引 - 病患相關任務查詢
    op.create_index('idx_tasks_patient', 'tasks', ['patient_id'])
    
    # 任務優先級索引 - 優先級排序
    op.create_index('idx_tasks_priority', 'tasks', ['priority'])
    
    # ### 新增 alert_notifications 表的效能索引 ###
    
    # 治療師未讀通報索引（條件索引）- 最關鍵的查詢路徑
    op.execute("""
        CREATE INDEX idx_alerts_therapist_unread 
        ON alert_notifications(therapist_id, is_read) 
        WHERE is_read = false
    """)
    
    # 時間排序索引 - 通報列表時間排序
    op.execute("""
        CREATE INDEX idx_alerts_created_at 
        ON alert_notifications(created_at DESC)
    """)
    
    # 警示等級索引 - 警示級別篩選
    op.create_index('idx_alerts_level', 'alert_notifications', ['level'])
    
    # 病患通報索引 - 病患相關警示查詢
    op.create_index('idx_alerts_patient', 'alert_notifications', ['patient_id'])
    
    # ### 設定預設值 ###
    
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        # 設定任務狀態預設值
        batch_op.alter_column('status', server_default='pending')
    
    with op.batch_alter_table('alert_notifications', schema=None) as batch_op:
        # 設定通報讀取狀態預設值
        batch_op.alter_column('is_read', server_default='false')


def downgrade():
    # ### 移除預設值 ###
    with op.batch_alter_table('alert_notifications', schema=None) as batch_op:
        batch_op.alter_column('is_read', server_default=None)
    
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.alter_column('status', server_default=None)
    
    # ### 移除 alert_notifications 索引 ###
    op.drop_index('idx_alerts_patient', table_name='alert_notifications')
    op.drop_index('idx_alerts_level', table_name='alert_notifications')
    op.drop_index('idx_alerts_created_at', table_name='alert_notifications')
    op.drop_index('idx_alerts_therapist_unread', table_name='alert_notifications')
    
    # ### 移除 tasks 索引 ###
    op.drop_index('idx_tasks_priority', table_name='tasks')
    op.drop_index('idx_tasks_patient', table_name='tasks')
    op.drop_index('idx_tasks_due_date', table_name='tasks')
    op.drop_index('idx_tasks_assignee_status', table_name='tasks')
