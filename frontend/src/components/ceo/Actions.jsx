import { ClipboardList, Calendar, BarChart3 } from "lucide-react";

import ActionButton from "./ActionButton";

/**
 * Actions component grouping various quick-action buttons for the CEO interface.
 * Contains action buttons to view tasks, view meetings, view analytics, and reassign tasks.
 */
const Actions = () => (
  <div className="flex gap-3">
    <ActionButton icon={ClipboardList} label="View Tasks" />
    <ActionButton icon={Calendar} label="View Meetings" />
    <ActionButton icon={BarChart3} label="View Analytics" />
    <button className="rounded-lg bg-red-600/20 cursor-pointer px-4 py-2 text-red-400 hover:bg-red-600/30">
      Reassign
    </button>
  </div>
);

export default Actions;
