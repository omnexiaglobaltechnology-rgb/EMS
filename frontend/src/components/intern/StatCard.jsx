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
    <div className="card-glass group relative overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Icon Wrapper */}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00d4ff]/10 text-[#00d4ff] blue-glow border border-[#00d4ff]/20 shadow-lg shadow-blue-500/10 mb-6">
        {icon}
      </div>

      <div className="space-y-1 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{title}</p>
        <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
        {subtitle && (
          <p className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest blue-glow mt-2">
             {subtitle}
          </p>
        )}
      </div>

      {/* Subtle Bottom Accent */}
      <div className="absolute bottom-0 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-[#00d4ff]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
};

export default StatCard;
