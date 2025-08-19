import React from "react";
import { getTaskMeta } from "../utils/taskMeta";

export default function TaskTable({
  tasks,
  loading,
  onEdit,
  onDelete,
  onSortChange,
}) {
  if (loading) {
    return <div style={{ padding: 12, color: "var(--muted)" }}>載入中…</div>;
  }

  const columns = [
    { key: "title", label: "標題" },
    { key: "type", label: "類型" },
    { key: "assigneeName", label: "負責人" },
    { key: "status", label: "狀態" },
    { key: "priority", label: "優先級" },
    { key: "patientId", label: "個案ID" },
    { key: "dueDate", label: "截止日" },
    { key: "createdAt", label: "建立時間" },
    { key: "updatedAt", label: "更新時間" },
  ];

  return (
    <div className="table-shell">
      <table className="table-sticky" aria-label="任務表格">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>
                <button
                  className="button"
                  onClick={() => onSortChange && onSortChange(`${c.key}:desc`)}
                  aria-label={`依 ${c.label} 排序`}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                >
                  {c.label} ↕️
                </button>
              </th>
            ))}
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {(tasks || []).map((t) => {
            const meta = getTaskMeta(t.type);
            return (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {t.title}
                  </div>
                  {t.description && (
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {t.description.slice(0, 50)}
                      {t.description.length > 50 ? "..." : ""}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`task-badge ${meta.colorClass}`}>
                    <span>{meta.icon}</span>
                    <span>{t.type}</span>
                  </span>
                </td>
                <td>
                  <span className="task-badge task-badge--gray">
                    👤 {t.assigneeName}
                  </span>
                </td>
                <td>
                  <span 
                    className={`task-badge ${getStatusBadgeClass(t.status)}`}
                  >
                    {getStatusIcon(t.status)} {labelStatus(t.status)}
                  </span>
                </td>
                <td>{t.priority || "-"}</td>
                <td>{t.patientId || "-"}</td>
                <td>
                  <span className="task-badge task-badge--gray">
                    📅 {t.dueDate}
                  </span>
                </td>
                <td style={{ fontSize: "13px", color: "#64748b" }}>
                  {formatDate(t.createdAt)}
                </td>
                <td style={{ fontSize: "13px", color: "#64748b" }}>
                  {formatDate(t.updatedAt)}
                </td>
                <td>
                  <div className="table-cell-actions">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {(!tasks || tasks.length === 0) && (
        <div style={{ padding: 12, color: "var(--muted)" }}>目前沒有任務</div>
      )}
    </div>
  );
}

function getStatusBadgeClass(status) {
  if (status === "todo") return "task-badge--gray";
  if (status === "in_progress") return "task-badge--brand";
  if (status === "in_review") return "task-badge--orange";
  if (status === "done") return "task-badge--teal";
  return "task-badge--gray";
}

function getStatusIcon(status) {
  if (status === "todo") return "⏳";
  if (status === "in_progress") return "▶️";
  if (status === "in_review") return "🔍";
  if (status === "done") return "✅";
  return "❓";
}

function formatDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  } catch {
    return "-";
  }
}

function labelStatus(s) {
  if (s === "todo") return "待辦";
  if (s === "in_progress") return "進行中";
  if (s === "in_review") return "審查中";
  if (s === "done") return "已完成";
  return s || "-";
}

function labelPriority(p) {
  if (!p) return "—";
  if (p === "high") return "高";
  if (p === "medium") return "中";
  if (p === "low") return "低";
  return p;
}
