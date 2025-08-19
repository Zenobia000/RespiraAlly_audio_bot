import React, { useEffect, useMemo, useState } from "react";
import { getTaskMeta } from "../utils/taskMeta";

export default function TaskFormModal({ initial, onClose, onSubmit }) {
  const isEdit = Boolean(initial && initial.id);
  const [form, setForm] = useState(() => ({
    title: "",
    description: "",
    type: "追蹤",
    assigneeId: "therapist-1",
    assigneeName: "治療師 A",
    status: "todo",
    dueDate: new Date().toISOString().slice(0, 10),
  }));

  useEffect(() => {
    if (initial && Object.keys(initial).length > 0) {
      setForm((f) => ({ ...f, ...initial }));
    }
  }, [initial]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.type || !form.assigneeId || !form.dueDate) return;
    onSubmit({
      title: form.title,
      description: form.description,
      type: form.type,
      assigneeId: form.assigneeId,
      assigneeName: form.assigneeName,
      status: form.status || "todo",
      dueDate: form.dueDate,
    });
  }

  const meta = getTaskMeta(form.type);

  return (
    <div role="dialog" aria-modal="true" className="modal-backdrop">
      <div className="card glass-strong modal-card">
        <header className="modal-header">
          <div className="title-row">
            <div style={{ fontSize: 24 }}>📋</div>
            <div>
              <h2 className="modal-title">
                {isEdit ? `編輯任務：${form.title || "(未命名)"}` : "新增任務"}
              </h2>
              <div className="modal-subtitle">
                <span className={`task-badge ${meta.colorClass}`}>
                  <span>{meta.icon}</span>
                  <span>{form.type}</span>
                </span>
                {form.assigneeName && (
                  <span className="task-badge task-badge--gray">
                    👤 {form.assigneeName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="關閉"
          >
            ✕
          </button>
        </header>
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-section">
            <div className="form-field">
              <label className="form-label">標題</label>
              <input
                className="form-input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="請輸入任務標題"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">描述</label>
              <textarea
                className="form-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="詳細描述任務內容..."
                rows={3}
              />
            </div>
          </div>
          <div className="form-section form-section--inline">
            <div className="form-field">
              <label className="form-label">任務類型</label>
              <select
                className="form-select"
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                <option value="追蹤">追蹤</option>
                <option value="衛教">衛教</option>
                <option value="回診">回診</option>
                <option value="評估">評估</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">負責人</label>
              <select
                className="form-select"
                name="assigneeId"
                value={form.assigneeId}
                onChange={handleChange}
              >
                <option value="therapist-1">治療師 A</option>
                <option value="therapist-2">治療師 B</option>
                <option value="therapist-3">治療師 C</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">狀態</label>
              <select
                className="form-select"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="todo">待辦</option>
                <option value="in_progress">進行中</option>
                <option value="in_review">審查中</option>
                <option value="done">已完成</option>
              </select>
            </div>
          </div>
          <div className="meta-section">
            <div className="meta-field">
              <label className="form-label">截止日期</label>
              <input
                className="form-input"
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="meta-field">
              <label className="form-label">建立時間</label>
              <div className="meta-badge">
                {formatDisplayDate(initial && initial.createdAt) ||
                  "建立後自動產生"}
              </div>
            </div>
            <div className="meta-field">
              <label className="form-label">更新時間</label>
              <div className="meta-badge">
                {formatDisplayDate(initial && initial.updatedAt) || "—"}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="button" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="button primary">
              {isEdit ? "儲存" : "建立"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDisplayDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}
