import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ClipboardCheck,
  FileClock,
  Calendar,
  CheckSquare,
  FileText,
  Activity,
  ChevronRight,
  TrendingUp,
  Clock,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  Bell
} from "lucide-react";

import { tasksApi, submissionsApi, usersApi, meetingsApi } from "../../utils/api";

/**
 * Premium Team Lead Dashboard.
 * Standardizes the command interface with real-time operational metrics and a high-fidelity glassmorphism theme.
 */
const TlDashboard = () => {
  const { name } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeTasks: 0,
    pendingReviews: 0,
    completedTasks: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Syncs real-time performance data from the management nodes.
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all tasks to compute core metrics
      const allTasks = await tasksApi.getAll();
      
      const activeTasks = allTasks.filter(t => ["in_progress", "assigned", "delegated", "pending"].includes(t.status));
      const completedTasks = allTasks.filter(t => t.status === "completed").length;
      const uniqueInterns = new Set(allTasks.map(t => t.assignedToId).filter(Boolean)).size;

      // 2. Fetch submissions for the review queue
      let pendingCount = 0;
      let activities = [];
      
      // We limit to the most recent tasks for performance and relevance
      const targetTasks = allTasks.slice(0, 15);
      
      for (const task of targetTasks) {
        try {
          const taskId = task.id || task._id;
          if (!taskId) continue;
          const taskSubmissions = await submissionsApi.getByTask(taskId);
          
          if (Array.isArray(taskSubmissions)) {
            const pendingEvents = taskSubmissions.filter(s => s.status === "pending" || s.status === "submitted");
            pendingCount += pendingEvents.length;

            taskSubmissions.slice(0, 2).forEach(sub => {
                activities.push({
                    id: sub.id || sub._id,
                    time: new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    text: `Submission '${task.title}' by '${sub.submittedBy?.name || 'Intern'}' uploaded.`,
                    icon: FileText,
                    rawDate: new Date(sub.createdAt)
                });
            });
          }
        } catch (e) { /* silent fail for individual nodes */ }
      }

      // Add task updates to log
      allTasks.slice(0, 5).forEach(task => {
        activities.push({
            id: `task-${task.id || task._id}`,
            time: new Date(task.updatedAt || task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `Task '${task.title}' transitioned to state '${task.status.toUpperCase()}'`,
            icon: CheckSquare,
            rawDate: new Date(task.updatedAt || task.createdAt)
        });
      });

      activities.sort((a, b) => b.rawDate - a.rawDate);

      setStats({
        totalInterns: uniqueInterns || 0,
        activeTasks: activeTasks.length || 0,
        pendingReviews: pendingCount || 0,
        completedTasks: completedTasks,
      });

      setRecentActivity(activities.slice(0, 6));

    } catch (err) {
      setError("Dashboard synchronization interrupted.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statConfig = [
    { title: "Team Members", value: stats.totalInterns, icon: Users, color: "indigo", subtitle: "Managed Interns" },
    { title: "Active Assets", value: stats.activeTasks, icon: ClipboardCheck, color: "emerald", subtitle: "Live Task Nodes" },
    { title: "Pending Audit", value: stats.pendingReviews, icon: FileClock, color: "rose", subtitle: "QA Reviews Required" },
    { title: "Production", value: stats.completedTasks, icon: Calendar, color: "amber", subtitle: "Finalized Outputs" },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center -m-4 md:-m-6 bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Authorizing Secure Dashboard Access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-1000 min-h-screen bg-[#0f172a] text-white p-6 md:p-8 -m-4 md:-m-6 font-sans overflow-x-hidden">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-3">
             <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 shadow-[inner_0_0_10px_rgba(0,0,0,0.3)]">
               <LayoutDashboard size={22} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Command & Control</span>
           </div>
          <h1 className="text-3xl md:text-3xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(99,102,241,0.2)]">
             Operational Center
          </h1>
          <p className="text-slate-400 mt-3 text-sm font-bold flex items-center gap-3 max-w-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
            Active Session: <span className="text-white uppercase tracking-widest">{name || "Administrator"}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-5 bg-white/5 p-2 rounded-[24px] border border-white/10 shadow-3xl backdrop-blur-3xl relative z-10">
           <div className="px-6 py-2.5 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white/5">
             Instance: NODE_G-4
           </div>
           <button 
             onClick={fetchDashboardData}
             className="p-3.5 rounded-xl bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all active:rotate-90 group shadow-lg"
           >
              <RefreshCw size={20} className="group-active:scale-90 transition-transform" />
           </button>
        </div>
      </div>

      {/* STATISTICS MODULE */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 relative z-10">
        {statConfig.map((item, idx) => (
          <div key={idx} className="group relative rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-[40px] p-8 hover:bg-white/10 transition-all duration-700 shadow-2xl hover:-translate-y-2 overflow-hidden border-t-white/20">
             <div className="flex items-start justify-between mb-8">
                <div className={`h-16 w-16 rounded-[24px] bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center text-${item.color}-400 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                   <item.icon size={30} strokeWidth={2.5} />
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/5 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center gap-2 group-hover:border-indigo-500/30 transition-colors">
                   <Bell size={12} className="opacity-50" /> Live 
                </div>
             </div>

             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.title}</p>
                <div className="flex items-baseline gap-3">
                   <h2 className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">{item.value || "0"}</h2>
                   <span className={`text-[10px] font-black text-${item.color}-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500`}>Active</span>
                </div>
                <p className="pt-2 text-[10px] font-black text-slate-600 uppercase tracking-widest opacity-80">{item.subtitle}</p>
             </div>
          </div>
        ))}
      </div>

      {/* LOWER ARCHITECTURE: LOGS & UTILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* EVENT LOGGER */}
        <div className="lg:col-span-8 rounded-[48px] border border-white/10 bg-white/5 backdrop-blur-3xl overflow-hidden shadow-3xl border-t-white/20">
          <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 shadow-inner">
                  <Activity size={24} />
               </div>
               <div>
                  <h2 className="text-base font-black text-white uppercase tracking-tighter">Event Protocol</h2>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-0.5">Real-time system updates</p>
               </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="group p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-white/5 rounded-[32px] transition-all duration-500 border border-transparent hover:border-white/5 shadow-inner">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xl group-hover:scale-105 duration-500">
                      <activity.icon size={26} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors tracking-tight leading-tight">{activity.text}</p>
                      <div className="flex items-center gap-4 pt-1">
                         <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase flex items-center gap-2">
                            <Clock size={12} className="text-indigo-500" /> {activity.time}
                         </span>
                         <span className="h-1 w-1 rounded-full bg-slate-800" />
                         <span className="text-[9px] font-black text-slate-600 tracking-widest uppercase bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">NODE_LOG_{String(activity.id).slice(-4)}</span>
                      </div>
                    </div>
                  </div>
                  <button className="h-12 w-12 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all active:scale-90 shadow-xl group/btn">
                    <ChevronRight size={22} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))
            ) : (
                <div className="py-40 text-center opacity-20 filter grayscale">
                    <LayoutDashboard size={80} className="mx-auto mb-6 text-slate-500 animate-pulse" />
                    <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-600">No Data Flow</p>
                </div>
            )}
          </div>
        </div>

        {/* SIDEBAR ASSETS */}
        <div className="lg:col-span-4 space-y-8">
           <div className="rounded-[48px] border border-white/10 bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 shadow-3xl relative overflow-hidden group/cta flex flex-col justify-between min-h-[400px]">
              <div className="absolute top-0 right-0 p-12 opacity-10 -mr-10 -mt-10 pointer-events-none group-hover/cta:rotate-12 transition-transform duration-1000">
                <Users size={200} />
              </div>
              <div className="relative z-10 flex-1">
                 <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-8 border border-white/20 shadow-inner">
                    <Users size={28} />
                 </div>
                <h3 className="text-3xl font-black text-white tracking-tighter mb-4 leading-tight">Sync Team Performance</h3>
                <p className="text-indigo-100 font-bold text-sm mb-10 opacity-70 leading-relaxed max-w-[240px]">Conduct a performance audit or cross-team sync to ensure production goals remain on target.</p>
              </div>
              <button 
                onClick={() => navigate("/team_lead/meetings")}
                className="relative z-10 w-full bg-white text-indigo-700 font-black text-xs uppercase tracking-widest py-6 rounded-[28px] shadow-3xl hover:bg-indigo-50 hover:scale-[1.02] transition-all active:scale-95 shadow-indigo-950/40"
              >
                Open Direct Portal
              </button>
           </div>

           <div className="rounded-[48px] border border-white/10 bg-white/5 backdrop-blur-3xl p-10 shadow-3xl border-t-white/20">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 shadow-inner flex items-center justify-center">
                   <TrendingUp size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Live Activity</h3>
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active task clusters</p>
                </div>
              </div>
              
              <div className="space-y-8">
                 {[
                   { name: "Frontend Cluster", status: "Active", val: 88 },
                   { name: "API Integration", status: "In Progress", val: 42 },
                   { name: "Documentation", status: "Stable", val: 95 }
                 ].map((cluster, i) => (
                   <div key={i} className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                         <p className="text-xs font-black text-white uppercase tracking-widest">{cluster.name}</p>
                         <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{cluster.status}</span>
                      </div>
                      <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                         <div 
                           className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                           style={{ width: `${cluster.val}%` }}
                         />
                      </div>
                   </div>
                 ))}
                 <button className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-400 transition-colors pt-6 border-t border-white/5">Production Metrics View</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TlDashboard;
