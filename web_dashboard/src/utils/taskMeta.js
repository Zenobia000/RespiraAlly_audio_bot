export const TASK_TYPE_META = {
  追蹤: {
    icon: "🔎",
    colorClass: "task-badge--brand",
    eventClass: "event--brand",
  },
  衛教: {
    icon: "📚",
    colorClass: "task-badge--teal",
    eventClass: "event--teal",
  },
  回診: {
    icon: "🏥",
    colorClass: "task-badge--orange",
    eventClass: "event--orange",
  },
  評估: {
    icon: "🧪",
    colorClass: "task-badge--purple",
    eventClass: "event--purple",
  },
  其他: {
    icon: "📝",
    colorClass: "task-badge--gray",
    eventClass: "event--gray",
  },
};

export function getTaskMeta(type) {
  return TASK_TYPE_META[type] || TASK_TYPE_META["其他"];
}
