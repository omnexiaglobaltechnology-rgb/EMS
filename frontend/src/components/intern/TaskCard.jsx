import StatusPill from "./StatusPill";

import { Calendar, Clock } from "lucide-react";

/**
 * Visual card representing a task assigned to an intern.
 * Displays title, priority, due date, timeframe, tags, progress status, and assignee.
 *
 * @param {object} task - Task details including priority, due date, time, status, and assignee
 */
const TaskCard = ({ task }) => {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="space-y-2">
          <h3 className="font-medium text-slate-900">{task.title}</h3>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Priority */}
            <span
              className={`font-medium ${
                task.priority === "high" ? "text-orange-600" : "text-sky-600"
              }`}
            >
              {task.priority}
            </span>

            {/* Due date */}
            <span className="flex items-center gap-1 text-red-600">
              <Calendar size={14} />
              {task.due} {task.overdue && "(overdue)"}
            </span>

            {/* Time */}
            <span className="flex items-center gap-1 text-slate-500">
              <Clock size={14} />
              {task.time}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {(task.tags || []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <StatusPill status={task.status} />

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
            {task.assignee}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
