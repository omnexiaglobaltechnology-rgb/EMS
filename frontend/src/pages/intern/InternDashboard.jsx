import { useEffect, useState, useCallback } from "react";
import {
  CheckSquare,
  Folder,
  Calendar,
  Timer,
  BarChart3,
  AlertCircle,
  Loader,
  RefreshCw,
} from "lucide-react";
import { useSelector } from "react-redux";

import RecentActivity from "../../components/intern/RecentActivity";

import { Link } from "react-router-dom";
import { tasksApi, submissionsApi, meetingsApi, trackingApi } from "../../utils/api";

// Local StatCard to match Manager Dashboard Glass Theme exactly
const GlassCard = ({ title, value, icon: IconComponent, trend }) => (
  <div className="rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 flex justify-between shadow-2xl transition-all duration-500 hover:bg-white/10 hover:-translate-y-1">
    <div>
      <p className="text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase">{title}</p>
      <p className="text-3xl font-bold mt-2 text-white tabular-nums drop-shadow-md">{value}</p>
      {trend && (
        <p className="text-emerald-400 text-[10px] font-bold mt-3 uppercase tracking-[0.15em] flex items-center gap-1">
           <span className="inline-block px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-lg">
             {trend}
           </span>
        </p>
      )}
    </div>
    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
      <IconComponent size={24} strokeWidth={2.5} />
    </div>
  </div>
);

/**
 * Central dashboard for interns.
 * Provides a high-level overview of assigned tasks, pending submissions,
 * upcoming meetings, and work hour progress.
 */
const InternDashboard = () => {
  const { id: internId, name } = useSelector((state) => state.auth);

  const [stats, setStats] = useState({
    assignedTasks: 0,
    pendingSubmissions: 0,
    meetings: 0,
    workedToday: "0h 0m",
    workedThisWeek: "0h 0m",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /**
   * Aggregates task and submission data to populate dashboard statistics.
   * Calculates active tasks and pending reviews for the current intern.
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all tasks
      const allTasks = await tasksApi.getAll();

      // Map tasks and find all tasks with submissions from this intern
      const processedTasks = await Promise.all(allTasks.map(async (task) => {
        const taskId = task.id || task._id;
        const isAssigned = String(task.assignedToId?._id || task.assignedToId?.id || task.assignedToId) === String(internId);
        
        let hasSubmissions = false;
        let isApproved = false;

        try {
          const subs = await submissionsApi.getByTask(taskId);
          if (Array.isArray(subs)) {
            const mySubs = subs.filter(s => String(s.submittedById?._id || s.submittedById?.id || s.submittedById) === String(internId));
            hasSubmissions = mySubs.length > 0;
            isApproved = mySubs.some(s => s.status === 'approved');
          }
        } catch (e) {
          console.warn(`Dashboard sync check failed for task ${taskId}`, e);
        }

        if (!isAssigned && !hasSubmissions) return null;

        return { ...task, status: isApproved ? 'approved' : task.status };
      }));

      const finalTasks = processedTasks.filter(t => t !== null);

      // Assigned Tasks: Things the intern needs to work on (unsubmitted)
      const activeTasks = finalTasks.filter(
        (task) => ["assigned", "delegated", "rejected", "in_progress"].includes(task.status),
      ).length;

      // 2. Count pending submissions (intern perspective: things they submitted that aren't completed yet)
      const pendingSubmissions = finalTasks.filter(
        (task) => task.status === "submitted" || task.status === "under_review",
      ).length;

      // 3. Fetch meetings
      let activeMeetings = 0;
      try {
        const allMeetings = await meetingsApi.getAll();
        const myMeetings = allMeetings.filter(m => {
          const organizerId = m.creatorId?._id || m.creatorId?.id || m.creatorId || m.organizerId;
          const isOrganizer = organizerId === internId;
          const isParticipant = m.invitees?.some(p => (p._id || p.id || p) === internId) ||
                                m.participants?.some(p => (p._id || p.id || p) === internId);
          return isOrganizer || isParticipant;
        });
        activeMeetings = myMeetings.length;
      } catch (meetErr) {
        console.warn("Could not fetch meetings:", meetErr);
      }

      // 4. Fetch work hours from real tracking API
      let workedToday = "0h 0m";
      let workedThisWeek = "0h 0m";
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const logsToday = await trackingApi.getTimeLogs({ startDate: today.toISOString() });
        workedToday = formatDuration(logsToday.totalDuration || 0);

        // Calculate week start (Monday)
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(today.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);

        const logsWeek = await trackingApi.getTimeLogs({ startDate: weekStart.toISOString() });
        workedThisWeek = formatDuration(logsWeek.totalDuration || 0);
      } catch (trackErr) {
        console.warn("Could not fetch time logs:", trackErr);
      }

      setStats({
        assignedTasks: activeTasks,
        pendingSubmissions,
        meetings: activeMeetings,
        workedToday,
        workedThisWeek,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [internId]);

  const formatDuration = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };



  /**
   * Computes completion percentage relative to a target goal.
   *
   * @param {string} worked - Time worked string
   * @param {string} goal - Target time string
   * @returns {number} Progress percentage
   */
  const calculateProgress = (worked, goal) => {
    // Parse worked time (e.g., "6h 30m")
    const workedMatch = worked.match(/(\d+)h\s*(\d+)?m?/);
    const workedMinutes =
      parseInt(workedMatch[1]) * 60 + (parseInt(workedMatch[2]) || 0);

    // Parse goal time
    const goalMatch = goal.match(/(\d+)h?/);
    const goalMinutes = parseInt(goalMatch[1]) * 60;

    return Math.round((workedMinutes / goalMinutes) * 100);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-slate-400 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const dailyProgress = calculateProgress(stats.workedToday, "8h");
  const weeklyProgress = calculateProgress(stats.workedThisWeek, "40h");



  return (
    <div className="space-y-10 animate-in fade-in duration-700 min-h-screen bg-[#0f172a] text-white p-6 md:p-8 -m-4 md:-m-6 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Intern Dashboard
          </h1>
          <p className="text-slate-400 mt-1 text-xs font-semibold flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Welcome back, <span className="text-indigo-400">{name || "User"}</span>! Here&apos;s your live summary.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
           <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-indigo-300 shadow-inner">
             Last updated: {new Date().toLocaleTimeString()}
           </div>
           <button 
             onClick={fetchDashboardData}
             className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 hover:bg-indigo-500/20 transition-all active:scale-90 group"
             title="Manual Sync"
           >
              <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
           </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 font-bold flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl animate-in fade-in slide-in-from-top-4 backdrop-blur-md mb-6">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
               <AlertCircle size={20} strokeWidth={3} />
             </div>
             <div>
               <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-500/60 mb-1">Database Connectivity Alert</p>
               <p className="text-xs font-bold text-white/90 leading-tight">{error}</p>
             </div>
          </div>
          <button 
             onClick={fetchDashboardData}
             className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-[#0f172a] text-[9px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center gap-2"
          >
             <RefreshCw size={12} />
             Retry Records Sync
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <Link to="/intern/my-tasks" className="block outline-none group">
          <GlassCard title="Assigned Tasks" value={stats.assignedTasks} trend="Active Tasks" icon={CheckSquare} />
        </Link>
        <Link to="/intern/submissions" className="block outline-none group">
          <GlassCard title="Submissions" value={String(stats.pendingSubmissions).padStart(2, "0")} trend="Awaiting Review" icon={Folder} />
        </Link>
        <Link to="/intern/meetings" className="block outline-none group">
          <GlassCard title="Meetings" value={String(stats.meetings).padStart(2, "0")} trend="Scheduled Today" icon={Calendar} />
        </Link>
        <div className="cursor-default">
          <GlassCard title="Worked Today" value={stats.workedToday} trend="Goal: 8h" icon={Timer} />
        </div>
        <div className="cursor-default">
          <GlassCard title="This Week" value={stats.workedThisWeek} trend="Goal: 40h" icon={BarChart3} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* TIME PROGRESS */}
        <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl transition-all hover:border-white/20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-3">
               <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-inner">
                  <Timer size={20} />
               </span>
               Time Progress
            </h2>
            <button className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-[0.2em] bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all">
              View Log
            </button>
          </div>

          <div className="space-y-8">
             <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.15em]">
                 <span className="text-slate-400">Daily Progress</span>
                 <span className="text-indigo-400">{dailyProgress}%</span>
               </div>
               <div className="w-full bg-white/5 border border-white/10 rounded-full h-3.5 overflow-hidden shadow-inner flex">
                 <div className="bg-indigo-500 h-full shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-1000 relative" style={{ width: `${Math.min(dailyProgress, 100)}%` }}>
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                 </div>
               </div>
             </div>
             
             <div className="space-y-3 pt-3 border-t border-white/5">
               <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.15em]">
                 <span className="text-slate-400">Weekly Progress <span className="opacity-50">(Week 02)</span></span>
                 <span className="text-emerald-400">{weeklyProgress}%</span>
               </div>
               <div className="w-full bg-white/5 border border-white/10 rounded-full h-3.5 overflow-hidden shadow-inner flex">
                 <div className="bg-emerald-500 h-full shadow-[0_0_15px_rgba(16,185,129,0.6)] transition-all duration-1000 relative" style={{ width: `${Math.min(weeklyProgress, 100)}%` }}>
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl transition-all hover:border-white/20">
           <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-inner">
                    <CheckSquare size={20} />
                </span>
                Activity Log
            </h2>
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
          </div>
          
          <div className="mt-[-20px] mx-[-10px] h-full overflow-hidden relative">
             {/* Ensure RecentActivity inherits the dark theme constraints properly by modifying its direct children via Tailwind */}
             <div className="[&>div]:border-none [&>div]:shadow-none [&>div]:bg-transparent [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-white [&_p]:text-[11px] [&_p]:text-slate-400 [&_.bg-white]:bg-transparent [&_li]:border-white/5 [&_svg]:text-indigo-400 [&_.bg-indigo-50]:bg-indigo-500/10">
                 <RecentActivity />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternDashboard;
