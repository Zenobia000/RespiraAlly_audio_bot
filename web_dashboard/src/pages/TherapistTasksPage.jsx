import React, { useEffect, useMemo, useState } from "react";
import TaskCalendar from "../components/TaskCalendar";
import TaskList from "../components/TaskList";
import TaskFormModal from "../components/TaskFormModal";
import TaskTable from "../components/TaskTable";
import TaskFilters from "../components/TaskFilters";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "../api/taskHooks";

export default function TherapistTasksPage() {
  const [range, setRange] = useState(() => {
    const d = new Date();
    const from = new Date(d.getFullYear(), d.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    return { from, to };
  });
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    assigneeId: "",
    q: "",
  });

  const { data, isLoading } = useTasks({ ...range, ...filters });
  const tasks = data?.data || [];

  const [editing, setEditing] = useState(null);
  const create = useCreateTask();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const [view, setView] = useState(
    () => localStorage.getItem("tasks:view") || "calendar"
  );

  useEffect(() => {
    localStorage.setItem("tasks:view", view);
  }, [view]);

  return (
    <div className="tasks-page">
      <header className="page-header">
        <h1 className="header-title">
          <span>🏥</span>
          呼吸治療師任務管理
        </h1>
        <p className="header-subtitle">
          管理患者追蹤、衛教計畫、回診安排與評估任務，提升治療品質與效率
        </p>
        <div className="toolbar-main">
          <div className="view-controls">
            <div className="seg-group">
              <button
                className={`seg-btn ${view === "calendar" ? "is-active" : ""}`}
                aria-pressed={view === "calendar"}
                onClick={() => setView("calendar")}
              >
                📅 日曆檢視
              </button>
              <button
                className={`seg-btn ${view === "board" ? "is-active" : ""}`}
                aria-pressed={view === "board"}
                onClick={() => setView("board")}
              >
                🗂️ 看板檢視
              </button>
              <button
                className={`seg-btn ${view === "table" ? "is-active" : ""}`}
                aria-pressed={view === "table"}
                onClick={() => setView("table")}
              >
                📋 表格檢視
              </button>
            </div>
          </div>
          <div className="view-controls">
            <TaskFilters value={filters} onChange={setFilters} />
            <button
              className="button primary"
              onClick={() => setEditing({})}
              aria-label="新增任務"
            >
              ✨ 新增任務
            </button>
          </div>
        </div>
      </header>

      {view === "calendar" ? (
        <div className="card glass edu-card" aria-label="任務日曆">
          <TaskCalendar
            tasks={tasks}
            range={range}
            onRangeChange={setRange}
            onDayClick={(day) =>
              setFilters((f) => ({ ...f, from: day, to: day }))
            }
            onEventClick={(task) => setEditing(task)}
            onEventUpdate={(id, patch) => update.mutate({ id, patch })}
          />
        </div>
      ) : view === "board" ? (
        <div className="kanban-container" aria-label="任務看板">
          <TaskList
            tasks={tasks}
            loading={isLoading}
            onEdit={setEditing}
            onDelete={(task) => del.mutate(task.id)}
            onSortChange={(sort) => setFilters((f) => ({ ...f, sort }))}
            kanban
            onMove={(taskId, newStatus) =>
              update.mutate({ id: taskId, patch: { status: newStatus } })
            }
          />
        </div>
      ) : (
        <div className="table-container" aria-label="任務表格">
          <TaskTable
            tasks={tasks}
            loading={isLoading}
            onEdit={setEditing}
            onDelete={(task) => del.mutate(task.id)}
            onSortChange={(sort) => setFilters((f) => ({ ...f, sort }))}
          />
        </div>
      )}
      {editing && (
        <TaskFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => {
            if (editing.id) {
              update.mutate(
                { id: editing.id, patch: payload },
                { onSuccess: () => setEditing(null) }
              );
            } else {
              create.mutate(payload, { onSuccess: () => setEditing(null) });
            }
          }}
        />
      )}
    </div>
  );
}
