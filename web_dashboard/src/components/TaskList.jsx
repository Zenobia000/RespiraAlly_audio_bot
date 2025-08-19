import React from "react";
import { getTaskMeta } from "../utils/taskMeta";

export default function TaskList({
  tasks,
  loading,
  onEdit,
  onDelete,
  onSortChange,
  kanban = false,
  onMove,
}) {
  if (loading) {
    return <div style={{ padding: 12, color: "var(--muted)" }}>載入中…</div>;
  }

  if (kanban) {
    const columns = [
      { key: "todo", title: "TO DO" },
      { key: "in_progress", title: "DOING" },
      { key: "in_review", title: "IN REVIEW" },
    ];
    const grouped = Object.fromEntries(columns.map((c) => [c.key, []]));
    (tasks || []).forEach((t) => {
      const k = grouped[t.status] ? t.status : "todo";
      grouped[k].push(t);
    });
    return (
      <div className="kanban-grid">
        {columns.map((col) => (
          <KanbanColumn
            key={col.key}
            title={col.title}
            status={col.key}
            items={grouped[col.key]}
            onEdit={onEdit}
            onDelete={onDelete}
            onDrop={(taskId) => onMove && onMove(taskId, col.key)}
          />
        ))}
      </div>
    );
  }

  const columns = [
    { key: "title", label: "標題" },
    { key: "type", label: "類型" },
    { key: "assigneeName", label: "負責人" },
    { key: "status", label: "狀態" },
    { key: "dueDate", label: "截止日" },
    { key: "createdAt", label: "建立時間" },
    { key: "updatedAt", label: "更新時間" },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table" style={{ width: "100%" }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>
                <button
                  className="link"
                  onClick={() => onSortChange && onSortChange(`${c.key}:desc`)}
                  aria-label={`依 ${c.label} 排序`}
                >
                  {c.label}
                </button>
              </th>
            ))}
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {(tasks || []).map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>
                {(() => {
                  const meta = getTaskMeta(t.type);
                  return (
                    <span className={`task-badge ${meta.colorClass}`}>
                      <span>{meta.icon}</span>
                      <span>{t.type}</span>
                    </span>
                  );
                })()}
              </td>
              <td>{t.assigneeName}</td>
              <td>{labelStatus(t.status)}</td>
              <td>{t.dueDate}</td>
              <td>{t.createdAt}</td>
              <td>{t.updatedAt}</td>
              <td>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="button"
                    onClick={() => onEdit && onEdit(t)}
                  >
                    編輯
                  </button>
                  <button
                    className="button danger"
                    onClick={() => onDelete && onDelete(t)}
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!tasks || tasks.length === 0) && (
        <div style={{ padding: 12, color: "var(--muted)" }}>目前沒有任務</div>
      )}
    </div>
  );
}

function labelStatus(s) {
  if (s === "todo") return "待辦";
  if (s === "in_progress") return "進行中";
  if (s === "in_review") return "審查中";
  if (s === "done") return "已完成";
  return s || "-";
}

function KanbanColumn({ title, status, items, onEdit, onDelete, onDrop }) {
  const meta = getTaskMeta("追蹤"); // Default fallback

  return (
    <div
      aria-label={title}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) onDrop(taskId);
      }}
      className="kanban-column"
    >
      <div className="kanban-col-title">{title}</div>
      <div className="kanban-items">
        {items.map((t) => {
          const taskMeta = getTaskMeta(t.type);
          return (
            <div
              key={t.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("text/plain", String(t.id))
              }
              className="kanban-card"
            >
              <div className="kanban-card-title">{t.title}</div>
              {t.description && (
                <div className="kanban-card-description">{t.description}</div>
              )}
              <div className="kanban-card-meta">
                <div className="kanban-card-badges">
                  <span className={`task-badge ${taskMeta.colorClass}`}>
                    <span>{taskMeta.icon}</span>
                    <span>{t.type}</span>
                  </span>
                  <span className="task-badge task-badge--gray">
                    👤 {t.assigneeName}
                  </span>
                  <span className="task-badge task-badge--gray">
                    📅 {t.dueDate}
                  </span>
                </div>
                <div className="kanban-card-actions">
                  <button
                    className="card-action-btn"
                    onClick={() => onEdit && onEdit(t)}
                    title="編輯任務"
                  >
                    ✏️
                  </button>
                  <button
                    className="card-action-btn"
                    onClick={() => onDelete && onDelete(t)}
                    title="刪除任務"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div
            style={{
              color: "#94a3b8",
              textAlign: "center",
              padding: "20px 12px",
              fontSize: "14px",
            }}
          >
            尚無任務
          </div>
        )}
      </div>
    </div>
  );
}
