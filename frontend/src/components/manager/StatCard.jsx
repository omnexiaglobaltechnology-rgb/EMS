// Stat Card Component

const StatCard = ({ title, value, trend, icon: IconComponent }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex justify-between shadow-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20">
      <div>
        <p className="text-slate-400 font-medium text-sm tracking-wide uppercase">{title}</p>
        <p className="text-3xl font-bold mt-2 text-white tabular-nums">{value}</p>
        {trend && (
          <p className="text-emerald-400 text-xs font-semibold mt-3 flex items-center gap-1">
            <span className="inline-block px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {trend}
            </span>
          </p>
        )}
      </div>

      <div className="h-12 w-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
        <IconComponent size={24} strokeWidth={2.5} />
      </div>
    </div>
  );
};

export default StatCard;
