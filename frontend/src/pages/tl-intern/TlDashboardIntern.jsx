import { useState, useEffect, useCallback } from "react";
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
  AlertCircle
} from "lucide-react";

import { tasksApi, submissionsApi, usersApi, meetingsApi } from "../../utils/api";

/**
 * Premium Dashboard for TL Interns.
 * Features a high-fidelity glassmorphism interface with real-time stats and activity tracking.
 */
const TlDashboardIntern = () => {
  const { id: _currentUserId, name } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeTasks: 0,
    pendingReviews: 0,
    upcomingMeetings: 0,
  });
  const [members, setMembers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Users (to get total interns)
      const interns = await usersApi.getAll({ role: 'intern' });
      
      // 2. Fetch all tasks 
      const allTasks = await tasksApi.getAll();
      const activeTasks = allTasks.filter(t => ["in_progress", "assigned", "delegated", "pending"].includes(t.status));

      // 3. Aggregate Pending Reviews
      let pendingCount = 0;
      let activities = [];
      
      for (const task of allTasks) {
        try {
          const taskId = task.id || task._id;
          if (!taskId) continue;
          const taskSubmissions = await submissionsApi.getByTask(taskId);
          
          if (Array.isArray(taskSubmissions)) {
            const pendingForThisTask = taskSubmissions.filter(s => s.status === "pending" || s.status === "submitted");
            pendingCount += pendingForThisTask.length;

            // Log recent submissions as activity
            taskSubmissions.slice(0, 3).forEach(sub => {
                activities.push({
                    id: sub.id || sub._id,
                    time: new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    text: `Submission '${task.title}' by '${sub.submittedBy?.name || 'Intern'}' is ready for review.`,
                    icon: FileText,
                    type: 'submission',
                    rawDate: new Date(sub.createdAt)
                });
            });
          }
        } catch (e) { console.warn(e); }
      }

      // 4. Fetch Today's Meetings
      const meetings = await meetingsApi.getAll();
      const today = new Date().toDateString();
      const todayMeetings = meetings.filter(m => new Date(m.date || m.scheduledAt).toDateString() === today);

      // Add task updates to activity
      allTasks.slice(0, 5).forEach(task => {
        activities.push({
            id: `task-${task.id || task._id}`,
            time: new Date(task.updatedAt || task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `Task '${task.title}' updated to ${task.status.toUpperCase()}`,
            icon: CheckSquare,
            type: 'task',
            rawDate: new Date(task.updatedAt || task.createdAt)
        });
      });

      // Sort and limit activities
      activities.sort((a, b) => b.rawDate - a.rawDate);

      setStats({
        totalInterns: interns.length || 0,
        activeTasks: activeTasks.length || 0,
        pendingReviews: pendingCount || 0,
        upcomingMeetings: todayMeetings.length || 0,
      });

      setMembers(interns.slice(0, 5));
      setRecentActivity(activities.slice(0, 6));

    } catch (err) {
      setError("Sync failed. Check connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statConfig = [
    { title: "Total Interns", value: stats.totalInterns, icon: Users, color: "indigo", subtitle: "Managed Workforce" },
    { title: "Active Goals", value: stats.activeTasks, icon: ClipboardCheck, color: "emerald", subtitle: "Tasks currently live" },
    { title: "Review Queue", value: stats.pendingReviews, icon: FileClock, color: "rose", subtitle: "Awaiting QA Approval" },
    { title: "Today's Agenda", value: stats.upcomingMeetings, icon: Calendar, color: "amber", subtitle: "Scheduled Syncs" },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center -m-4 md:-m-6 bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500 shadow-indigo-500/20" />
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Syncing Operational Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 min-h-screen bg-[#0f172a] text-white p-6 md:p-8 -m-4 md:-m-6 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-inner">
               <Activity size={20} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System Monitoring</span>
           </div>
          <h1 className="text-3xl md:text-3xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Command Dashboard
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-bold flex items-center gap-2 max-w-lg opacity-80">
            Welcome back, <span className="text-indigo-400 uppercase tracking-widest">{name || "Leader"}</span>. Here is the team&apos;s live operational status.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
           <div className="px-5 py-2 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
             Live Node: EMS-ALPHA-01
           </div>
           <button 
             onClick={fetchDashboardData}
             className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all active:scale-90 group"
           >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
           </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 animate-in shake duration-500">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.map((item, idx) => (
          <div key={idx} className="group relative rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 hover:bg-white/10 transition-all duration-500 shadow-2xl hover:-translate-y-1 overflow-hidden">
             {/* Gradient Background Decoration */}
             <div className={`absolute -right-8 -bottom-8 h-32 w-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-3xl bg-${item.color}-500`} />
             
             <div className="flex items-start justify-between relative z-10">
                <div className={`h-14 w-14 rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center text-${item.color}-400 shadow-inner mb-6`}>
                   <item.icon size={28} strokeWidth={2.5} />
                </div>
                <div className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/20 flex items-center gap-1.5 shadow-lg">
                   <TrendingUp size={10} /> +0% 
                </div>
             </div>

             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{item.title}</p>
                <div className="flex items-baseline gap-2">
                   <h2 className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">{item.value || "0"}</h2>
                   {item.value > 9 && <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse">Critical</span>}
                </div>
                <p className="mt-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.subtitle}</p>
             </div>
          </div>
        ))}
      </div>

      {/* LOWER GRID: ACTIVITY & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LOG PANEL */}
        <div className="lg:col-span-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-3xl overflow-hidden shadow-3xl">
          <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                  <Activity size={20} />
               </div>
               <h2 className="text-base font-black text-white uppercase tracking-widest">Team Performance Log</h2>
            </div>
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">Export Logs</button>
          </div>

          <div className="p-6 divide-y divide-white/5">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="group p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 rounded-3xl transition-all duration-300">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner group-hover:scale-110">
                      <activity.icon size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">{activity.text}</p>
                      <div className="flex items-center gap-3 mt-1.5 opacity-60">
                         <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase flex items-center gap-1">
                            <Clock size={10} /> {activity.time}
                         </span>
                         <span className="h-1 w-1 rounded-full bg-slate-700" />
                         <span className="text-[9px] font-black text-indigo-400 tracking-widest uppercase font-mono bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">EVENT_ID: {String(activity.id).slice(-4)}</span>
                      </div>
                    </div>
                  </div>
                  <button className="h-10 w-10 rounded-[15px] bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:bg-white/10 hover:text-white transition-all active:scale-90">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))
            ) : (
                <div className="py-32 text-center opacity-20 filter grayscale">
                    <LayoutDashboard size={64} className="mx-auto mb-6 text-slate-400" />
                    <p className="text-xl font-black uppercase tracking-[0.3em] text-slate-500">Buffer Void</p>
                </div>
            )}
          </div>
        </div>

        {/* UTILITY PANEL */}
        <div className="lg:col-span-4 space-y-8">
           <div className="rounded-[40px] border border-white/10 bg-indigo-600 p-10 shadow-3xl relative overflow-hidden group/cta">
              <div className="absolute -right-10 -bottom-10 h-64 w-64 bg-white/10 rounded-full blur-[80px] group-hover/cta:scale-150 transition-transform duration-1000" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white tracking-tight mb-2">Team Sync Required?</h3>
                <p className="text-indigo-100 font-medium text-sm mb-8 opacity-80 leading-relaxed">Schedule a direct alignment meeting with your managed interns to review roadblocks.</p>
                <button 
                  onClick={() => navigate("/team_lead_intern/meetings")}
                  className="w-full bg-white text-indigo-600 font-black text-xs uppercase tracking-widest py-5 rounded-[24px] shadow-2xl hover:scale-105 transition-all shadow-indigo-900/50 active:scale-95"
                >
                  Initiate Meeting
                </button>
              </div>
           </div>

           <div className="rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-3xl p-10 shadow-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shadow-inner">
                   <Users size={20} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Active Members</h3>
              </div>
              
              <div className="space-y-6">
                 {members.length > 0 ? members.map((member, i) => (
                   <div key={i} className="flex items-center justify-between group/member">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs font-black drop-shadow-lg border border-white/20 uppercase tracking-tighter">
                            {member.name ? member.name.split(' ').map(n=>n[0]).join('') : "NI"}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-white leading-none group-hover/member:text-indigo-300 transition-colors uppercase tracking-tight">{member.name}</p>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Status: Active</p>
                         </div>
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                   </div>
                 )) : (
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-center py-4">No Members Cataloged</p>
                 )}
                 <button className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors pt-4">View All Members</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TlDashboardIntern;
