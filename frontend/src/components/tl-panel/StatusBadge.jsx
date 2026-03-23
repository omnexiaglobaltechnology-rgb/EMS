/**
 * A general-purpose badge for indicating the state of a task or entity.
 * Supports states like "In Progress", "Not Started", and "Completed".
 *
 * @param {string} value - The status text to display
 */
const StatusBadge = ({ value }) => {
  const map = {
    "In Progress": "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]",
    "Not Started": "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    "Under Review": "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    "Submitted": "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    "Rejected": "bg-red-500/10 text-red-400 border border-red-500/20",
    Completed: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
  };
  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight backdrop-blur-md transition-all ${map[value]}`}
    >
      {value}
    </span>
  );
};

export default StatusBadge;
