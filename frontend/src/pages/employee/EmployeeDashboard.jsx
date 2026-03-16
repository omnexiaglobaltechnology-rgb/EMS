import { useEffect, useState } from "react";
import {
  CheckSquare,
  Folder,
  Calendar,
  Timer,
  BarChart3,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useSelector } from "react-redux";

import StatCard from "../../components/intern/StatCard";
import RecentActivity from "../../components/intern/RecentActivity";

import { Link } from "react-router-dom";
import { tasksApi, submissionsApi } from "../../utils/api";

/**
 * Central dashboard for Employees.
 */
const EmployeeDashboard = () => {
  const { name, id: userId } = useSelector((state) => state.auth);

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
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const allTasks = await tasksApi.getAll();
      
      const myTasks = allTasks.filter(
        (task) => task.assignedToId === userId || task.currentResponsibleId === userId
      );

      const activeTasks = myTasks.filter(
        (task) => ["assigned", "delegated", "under_review"].includes(task.status)
      ).length;

      // Count pending submissions (awaiting review by me or related to my tasks)
      // For now, simple count
      const pendingSubmissions = myTasks.filter(t => t.status === 'submitted').length;

      setStats({
        assignedTasks: activeTasks,
        pendingSubmissions,
        meetings: 0, 
        workedToday: "0h 0m",
        workedThisWeek: "0h 0m",
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-slate-400" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-tight">
          Welcome back, <span className="text-[#00d4ff] blue-glow">{name || "Employee"}</span>
        </h1>
        <div className="flex items-center gap-4 mt-3">
           <div className="h-1 w-20 bg-[#00d4ff] rounded-full blue-glow"></div>
           <p className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">
             Authorized Deployment Module
           </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-4 rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-xs font-bold text-red-200 uppercase tracking-wider">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Link to="/employee/my-tasks" className="transition-transform active:scale-95">
          <StatCard
            title="Assigned Tasks"
            value={String(stats.assignedTasks)}
            subtitle="Processing..."
            icon={<CheckSquare size={20} />}
          />
        </Link>

        <Link to="/employee/submissions" className="transition-transform active:scale-95">
          <StatCard
            title="Submissions"
            value={String(stats.pendingSubmissions)}
            icon={<Folder size={20} />}
            subtitle="Pending Sync"
          />
        </Link>

        <Link to="/employee/meetings" className="transition-transform active:scale-95">
          <StatCard
            title="Neural Link"
            value={String(stats.meetings)}
            icon={<Calendar size={20} />}
            subtitle="Secure Meetings"
          />
        </Link>

        <StatCard
          title="Daily Uptime"
          value={stats.workedToday}
          subtitle="Goal achieved: 65%"
          icon={<Timer size={20} />}
        />

        <StatCard
          title="Weekly Stream"
          value={stats.workedThisWeek}
          subtitle="Network average"
          icon={<BarChart3 size={20} />}
        />
      </div>

      <div className="glass-dark p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d4ff]/5 blur-[100px] rounded-full group-hover:bg-[#00d4ff]/10 transition-colors"></div>
         <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] mb-4">Metric <span className="text-[#00d4ff] blue-glow">Optimization</span></h3>
         <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest italic">Analyzing real-time performance vectors...</p>
      </div>

      <RecentActivity />
    </div>
  );
};

export default EmployeeDashboard;
