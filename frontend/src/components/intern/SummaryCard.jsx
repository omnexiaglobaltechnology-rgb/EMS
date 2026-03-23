/**
 * A minimalist card component designed to display a brief summary metric.
 *
 * @param {string} title - The title of the summary metric
 * @param {string|number} value - The numerical or text value of the metric
 * @param {string} [color="slate"] - Tailwind color palette name indicating the value's text color
 */
const SummaryCard = ({ title, value, color = "indigo" }) => {
  const colorMap = {
    slate: "text-slate-400 border-white/10 bg-white/5",
    emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    indigo: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
  };

  return (
    <div className={`rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] shadow-2xl ${colorMap[color] || colorMap.indigo}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
};

export default SummaryCard;
