/**
 * A styled card component designed to highlight a primary metric or statistic.
 *
 * @param {object} stat - Object containing title, value, subtitle, and an icon component
 */
const StatCard = ({ stat }) => {
  const Icon = stat.icon;

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Top Accent */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-indigo-600" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{stat.title}</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-600">
            {stat.value}
          </p>
          <p className="mt-1 text-sm text-slate-500">{stat.subtitle}</p>
        </div>

        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
