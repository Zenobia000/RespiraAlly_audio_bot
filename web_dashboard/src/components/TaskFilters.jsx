import React from "react";

export default function TaskFilters({ value, onChange }) {
  function handle(e) {
    const { name, value: v } = e.target;
    onChange({ ...value, [name]: v });
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <input
        className="form-input"
        placeholder="🔍 搜尋標題或描述"
        value={value.q || ""}
        name="q"
        onChange={handle}
        aria-label="搜尋任務"
        style={{ minWidth: "180px", fontSize: "14px" }}
      />
      <select
        className="form-select"
        name="status"
        value={value.status || ""}
        onChange={handle}
        aria-label="狀態篩選"
        style={{ minWidth: "120px" }}
      >
        <option value="">📊 全部狀態</option>
        <option value="todo">⏳ 待辦</option>
        <option value="in_progress">▶️ 進行中</option>
        <option value="in_review">🔍 審查中</option>
        <option value="done">✅ 已完成</option>
      </select>
      <select
        className="form-select"
        name="type"
        value={value.type || ""}
        onChange={handle}
        aria-label="類型篩選"
        style={{ minWidth: "120px" }}
      >
        <option value="">🏷️ 全部類型</option>
        <option value="追蹤">📋 追蹤</option>
        <option value="衛教">📚 衛教</option>
        <option value="回診">🏥 回診</option>
        <option value="評估">📊 評估</option>
        <option value="其他">📝 其他</option>
      </select>
      <select
        className="form-select"
        name="assigneeId"
        value={value.assigneeId || ""}
        onChange={handle}
        aria-label="負責人篩選"
        style={{ minWidth: "140px" }}
      >
        <option value="">👥 全部負責人</option>
        <option value="therapist-1">👤 治療師 A</option>
        <option value="therapist-2">👤 治療師 B</option>
        <option value="therapist-3">👤 治療師 C</option>
      </select>
    </div>
  );
}
