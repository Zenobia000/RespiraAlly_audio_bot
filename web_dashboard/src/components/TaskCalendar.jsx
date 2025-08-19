import React from "react";
import { getTaskMeta } from "../utils/taskMeta";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function TaskCalendar({
  tasks,
  range,
  onRangeChange,
  onDayClick,
  onEventClick,
  onEventUpdate,
}) {
  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable
        eventResizableFromStart
        events={(tasks || []).map((t) => {
          const meta = getTaskMeta(t.type);
          return {
            id: t.id,
            title: `${meta.icon} ${t.title}`,
            start: t.dueDate,
            end:
              t.durationDays && t.durationDays > 1
                ? addDaysISO(t.dueDate, t.durationDays)
                : undefined,
            allDay: true,
            className: meta.eventClass,
          };
        })}
        datesSet={(arg) =>
          onRangeChange({
            from: arg.startStr.slice(0, 10),
            to: arg.endStr.slice(0, 10),
          })
        }
        dateClick={(arg) => onDayClick && onDayClick(arg.dateStr)}
        eventClick={(info) => {
          const found = (tasks || []).find(
            (t) => String(t.id) === String(info.event.id)
          );
          if (found && onEventClick) onEventClick(found);
        }}
        eventDrop={(info) => {
          if (!onEventUpdate) return;
          const newStart = info.event.startStr.slice(0, 10);
          onEventUpdate(info.event.id, { dueDate: newStart });
        }}
        eventResize={(info) => {
          if (!onEventUpdate) return;
          const start = info.event.startStr.slice(0, 10);
          const endIso = info.event.endStr
            ? info.event.endStr.slice(0, 10)
            : start;
          const days = Math.max(1, diffDays(start, endIso));
          onEventUpdate(info.event.id, { dueDate: start, durationDays: days });
        }}
        height="auto"
      />
    </div>
  );
}

function addDaysISO(iso, days) {
  const d = new Date(iso);
  const out = new Date(d);
  out.setDate(d.getDate() + days);
  return out.toISOString().slice(0, 10);
}

function diffDays(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}
