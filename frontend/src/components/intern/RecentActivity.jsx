import { useEffect, useState, useCallback } from "react";
import { CheckSquare, FileText, Loader2, Clock, MousePointer2 } from "lucide-react";
import { useSelector } from "react-redux";
import { tasksApi, trackingApi } from "../../utils/api";

const RecentActivity = () => {
  const { id: internId } = useSelector((state) => state.auth);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (internId) fetchActivities();
  }, [internId, fetchActivities]);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Task History
      const allTasks = await tasksApi.getAll();
      const internTasks = allTasks.filter(t => (t.assignedToId?._id || t.assignedToId?.id || t.assignedToId) === internId);
      
      let items = [];
      
      internTasks.forEach(task => {
        if (task.history && Array.isArray(task.history)) {
          task.history.forEach(hist => {
            items.push({
              id: `${task._id}-${hist._id}`,
              time: formatRelativeTime(hist.updatedAt || hist.timestamp || task.updatedAt),
              rawDate: new Date(hist.updatedAt || hist.timestamp || task.updatedAt),
              text: `${hist.note || 'No note'} (Task: ${task.title})`,
              icon: hist.status === 'submitted' ? FileText : CheckSquare,
              color: hist.status === 'completed' ? 'emerald' : 'indigo',
              type: 'task'
            });
          });
        }
      });

      // 2. Fetch tracking logs (page visits, etc)
      try {
        const pageLogs = await trackingApi.getPageActivity({ limit: 10 });
        if (pageLogs && Array.isArray(pageLogs.activities)) {
          pageLogs.activities.forEach(log => {
             items.push({
               id: log._id,
               time: formatRelativeTime(log.timestamp),
               rawDate: new Date(log.timestamp),
               text: `Visited ${log.pageTitle || log.pagePath}`,
               icon: MousePointer2,
               color: 'indigo',
               type: 'page'
             });
          });
        }
      } catch {
        console.warn("Tracking fetch failed");
      }

      // Sort by recency
      items.sort((a, b) => b.rawDate - a.rawDate);
      setActivities(items.slice(0, 6));

    } catch (err) {
      console.error("Activity fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [internId]);

  const formatRelativeTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  }

  if (loading) {
     return (
       <div className="flex h-40 items-center justify-center">
         <Loader2 className="animate-spin text-indigo-500" size={24} />
       </div>
     );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Clock size={40} className="mb-4 opacity-10" />
        <p className="text-sm font-bold opacity-30">No recent activity detected</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>

      {/* Activity list */}
      <div className="mt-6 space-y-6">
        {activities.map((item, index) => {
          const Icon = item.icon;
          
          return (
            <div key={item.id}>
              <div className="flex items-start gap-4 group cursor-default">
                {/* Icon */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300
                    ${item.color === 'emerald' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}
                    shadow-inner scale-90 group-hover:scale-100`}>
                  <Icon size={22} strokeWidth={2.5} />
                </div>

                {/* Content */}
                <div className="flex-1 py-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {item.time}
                    </p>
                    <span className={`h-1.5 w-1.5 rounded-full ${item.color === 'emerald' ? 'bg-emerald-500' : 'bg-indigo-500'} opacity-30 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-200 leading-relaxed group-hover:text-white transition-colors">
                    {item.text}
                  </p>
                </div>
              </div>

              {/* Divider */}
              {index !== activities.length - 1 && (
                <div className="my-6 border-t border-white/5 mx-4" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <button className="w-full py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all shadow-lg active:scale-95">
          View Full Activity Log
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
