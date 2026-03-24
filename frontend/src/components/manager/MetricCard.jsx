// eslint-disable-next-line no-unused-vars
/**
 * A specialized card component used by managers to display key analytical metrics and trends.
 *
 * @param {string} title - The metric title
 * @param {string|number} value - The primary statistic value
 * @param {string} change - A descriptive string illustrating the recent change or trend
 * @param {React.ElementType} icon - Icon component to visually represent the metric
 * @param {boolean} negative - Whether the trend is inherently negative, to trigger conditional styling
 */
const MetricCard = ({ title, value, change, icon: Icon, negative }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex justify-between shadow-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 group">
      <div>
        <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">{title}</p>
        <p className="text-3xl font-extrabold mt-3 text-white tabular-nums group-hover:scale-105 transition-transform duration-300 origin-left">
          {value}
        </p>
        <div 
          className={`mt-4 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ring-1 ring-inset ${
            negative 
              ? "bg-red-500/10 text-red-400 ring-red-500/20" 
              : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
          }`}
        >
          {change}
        </div>
      </div>

      <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner group-hover:bg-indigo-500/20 transition-colors">
        <Icon size={28} strokeWidth={2} />
      </div>
    </div>
  );
};

export default MetricCard;
