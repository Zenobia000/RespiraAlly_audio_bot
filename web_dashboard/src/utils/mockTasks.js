import { randomBetween } from "./mock";

function randomAssignee() {
  const list = [
    { id: "therapist-1", name: "治療師 A" },
    { id: "therapist-2", name: "治療師 B" },
    { id: "therapist-3", name: "治療師 C" },
  ];
  return list[randomBetween(0, list.length - 1)];
}

export function genMockTasks(count = 20, monthOffset = 0) {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1 + monthOffset, 0);
  const types = ["追蹤", "衛教", "回診", "評估", "其他"];
  const statuses = ["todo", "in_progress", "done"];
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setDate(randomBetween(1, end.getDate()));
    const assignee = randomAssignee();
    const created = new Date(d);
    created.setDate(created.getDate() - randomBetween(0, 10));
    const updated = new Date(created);
    updated.setDate(updated.getDate() + randomBetween(0, 10));
    out.push({
      id: String(5000 + i),
      title: `任務 ${i + 1}`,
      description: "",
      type: types[randomBetween(0, types.length - 1)],
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      status: statuses[randomBetween(0, statuses.length - 1)],
      dueDate: d.toISOString().slice(0, 10),
      createdAt: created.toISOString(),
      updatedAt: updated.toISOString(),
    });
  }
  return out;
}
