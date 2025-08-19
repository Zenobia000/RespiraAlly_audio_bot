import { api } from "./client";
import { genMockTasks } from "../utils/mockTasks";

// 暫以前端記憶體 mock，後端就緒後改為 USE_MOCK = false
const USE_MOCK = true;
let memoryTasks = genMockTasks(28);

function filterAndSort(tasks, params = {}) {
  let out = tasks.slice();
  const { status, type, assigneeId, q, from, to, sort } = params;
  if (status) out = out.filter((t) => t.status === status);
  if (type) out = out.filter((t) => t.type === type);
  if (assigneeId) out = out.filter((t) => t.assigneeId === assigneeId);
  if (from) out = out.filter((t) => (t.dueDate || "") >= from);
  if (to) out = out.filter((t) => (t.dueDate || "") <= to);
  if (q) {
    const s = q.toLowerCase();
    out = out.filter((t) =>
      (t.title + " " + (t.description || "")).toLowerCase().includes(s)
    );
  }
  if (sort) {
    const [key, dir] = String(sort).split(":");
    out.sort((a, b) => (a[key] > b[key] ? 1 : -1) * (dir === "desc" ? -1 : 1));
  } else {
    out.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
  }
  return out;
}

export function getTasks(params) {
  if (USE_MOCK) {
    const data = filterAndSort(memoryTasks, params);
    return Promise.resolve({ data, total: data.length });
  }
  const qs = new URLSearchParams(params || {}).toString();
  return api(`/v1/therapist/tasks${qs ? `?${qs}` : ""}`);
}

export function createTask(payload) {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    const item = {
      id: String(Math.max(0, ...memoryTasks.map((t) => +t.id)) + 1),
      createdAt: now,
      updatedAt: now,
      status: "todo",
      ...payload,
    };
    memoryTasks = [item, ...memoryTasks];
    return Promise.resolve(item);
  }
  return api(`/v1/therapist/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTask(id, patch) {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    memoryTasks = memoryTasks.map((t) =>
      String(t.id) === String(id) ? { ...t, ...patch, updatedAt: now } : t
    );
    const item = memoryTasks.find((t) => String(t.id) === String(id));
    return Promise.resolve(item);
  }
  return api(`/v1/therapist/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteTask(id) {
  if (USE_MOCK) {
    memoryTasks = memoryTasks.filter((t) => String(t.id) !== String(id));
    return Promise.resolve({ ok: true });
  }
  return api(`/v1/therapist/tasks/${id}`, { method: "DELETE" });
}
