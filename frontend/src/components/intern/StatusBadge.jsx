/**
 * A visual badge indicating the current state of an item (e.g., approved, pending, rejected).
 * Colors dynamically adapt based on the provided status.
 *
 * @param {string} status - A predefined status string determining the badge color
 */
const StatusBadge = ({ status }) => {
  const styles = {
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span
      className={`rounded-lg px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-lg backdrop-blur-md ${styles[status] || "bg-white/5 text-white border-white/10"}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
