import { CheckSquare, Calendar, FileText } from "lucide-react";

const activities = [];

/**
 * Renders a list of the most recent activities relevant to the intern.
 * Hardcoded activities list maps different updates (tasks, meetings, submissions) to specific visual icons and colors.
 */
const RecentActivity = () => {
  return (
    <div className="glass-dark rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h2 className="text-xs font-black uppercase tracking-[0.25em] text-white">System <span className="text-[#00d4ff] blue-glow">Activity</span></h2>
        <div className="h-1 w-12 bg-white/10 rounded-full"></div>
      </div>

      {/* Activity list */}
      <div className="space-y-6 relative z-10">
        {activities.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">No historical data in stream</p>
          </div>
        ) : activities.map((item, index) => {
          const Icon = item.icon;

          return (
            <div key={index} className="group relative">
              <div className="flex items-start gap-5">
                {/* Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40 group-hover:text-[#00d4ff] group-hover:border-[#00d4ff]/20 group-hover:bg-[#00d4ff]/5 transition-all duration-300">
                  <Icon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 py-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#00d4ff] blue-glow mb-1">
                    {item.time}
                  </p>
                  <p className="text-sm font-bold text-white/70 group-hover:text-white transition-colors tracking-tight leading-tight">{item.text}</p>
                </div>
              </div>

              {/* Divider */}
              {index !== activities.length - 1 && (
                <div className="mt-6 border-t border-white/5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-10 pt-4 border-t border-white/5 flex justify-center">
        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00d4ff] blue-glow hover:opacity-70 transition-all flex items-center gap-2">
          View Master Log <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
