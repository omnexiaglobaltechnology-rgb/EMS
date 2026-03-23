/**
 * Renders a small badge displaying task priority (High, Medium, Low) with corresponding colors.
 *
 * @param {string} value - The priority level to display
 */
const PriorityBadge = ({ value }) => {
  const map = {
    High: "bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
    Medium: "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
    Low: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
  };
  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight backdrop-blur-md transition-all ${map[value]}`}
    >
      {value}
    </span>
  );
};

export default PriorityBadge;
