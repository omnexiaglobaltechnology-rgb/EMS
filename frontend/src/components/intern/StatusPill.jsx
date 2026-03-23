/**
 * A pill-shaped status indicator, primarily used for tasks or submissions.
 * Maps specific statuses (pending, in-progress, review, completed) to visually distinct styles and text.
 *
 * @param {string} status - The current status of the item
 */
const StatusPill = ({ status }) => {
  const map = {
    assigned: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    delegated: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    submitted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    under_review: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    in_progress: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    // Fallbacks
    pending: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "in-progress": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  const labelMap = {
    assigned: "Assigned",
    delegated: "Delegated",
    submitted: "Submitted",
    under_review: "In Review",
    approved: "Approved",
    completed: "Completed",
    rejected: "Rejected",
    pending: "Pending",
    in_progress: "In Progress",
    "in-progress": "In Progress",
  };

  return (
    <span
      className={`rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border shadow-lg backdrop-blur-md ${map[status] || "bg-white/5 text-white border-white/10"}`}
    >
      {labelMap[status] || status}
    </span>
  );
};

export default StatusPill;
