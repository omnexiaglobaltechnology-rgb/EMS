/**
 * A highly customizable card component for displaying key metric statistics.
 *
 * @param {string} title - The metric title
 * @param {string|number} value - The primary statistic value
 * @param {string} subtitle - Optional secondary descriptive text
 * @param {React.ReactNode} icon - Icon component visually representing the metric
 * @param {string} bg - CSS class for background styling
 * @param {string} iconBg - CSS class for the icon's background styling
 * @param {string} border - CSS class for border styling
 */
const StatCard = ({ title, value, subtitle, icon, bg, iconBg, border }) => {
  return (
    <div className={`relative rounded-2xl border ${border} ${bg} p-6`}>
      {/* Icon */}
      <div
        className={`absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </div>

      {/* Content */}
      <p className="text-lg font-medium text-slate-600">{title}</p>

      <p className="mt-2 text-4xl font-bold text-slate-900">{value}</p>

      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
