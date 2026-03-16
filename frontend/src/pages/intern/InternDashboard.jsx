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
  }, []);

  /**
   * Aggregates task and submission data to populate dashboard statistics.
   * Calculates active tasks and pending reviews for the current intern.
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all tasks
      const allTasks = await tasksApi.getAll();

      // Filter tasks assigned to this intern
      const internTasks = allTasks.filter(
        (task) => task.assignedToId === internId,
      );

      // Count tasks by status
      const activeTasks = internTasks.filter(
        (task) => task.status === "pending" || task.status === "in_progress",
      ).length;

      // Fetch submissions for assigned tasks
      let allSubmissions = [];
      for (const task of internTasks) {
        try {
          const taskId = task.id || task._id;
          if (!taskId) continue;
          const taskSubmissions = await submissionsApi.getByTask(taskId);
          allSubmissions.push(...taskSubmissions);
        } catch (err) {
          console.warn(`Could not fetch submissions for task ${task.id}:`, err);
        }
      }

      // Count pending submissions
      const pendingSubmissions = allSubmissions.filter(
        (sub) => sub.status === "pending",
      ).length;

      // Calculate work hours (simple calculation based on task count)
      // In a real system, this would come from a time tracking service
      const workedToday = calculateWorkHours(internTasks, "today");
      const workedThisWeek = calculateWorkHours(internTasks, "week");

      setStats({
        assignedTasks: activeTasks,
        pendingSubmissions,
        meetings: 0, // Meetings data would come from a different API
        workedToday,
        workedThisWeek,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Derives work duration based on task status and update timestamps.
   * This is a simplified simulation of time tracking.
   *
   * @param {Array} tasks - List of intern tasks
   * @param {string} period - Time range ('today' or 'week')
   * @returns {string} Formatted time string (e.g., "6h 30m")
   */
  const calculateWorkHours = (tasks, period) => {
    // Simulated logic removed to prevent dummy data impact in production
    return "0h 0m";
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-slate-400" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const dailyProgress = calculateProgress(stats.workedToday, "8h");
  const weeklyProgress = calculateProgress(stats.workedThisWeek, "40h");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Welcome back, {name || "User"}!
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Here's your work summary for today and this week.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Link to="/intern/my-tasks" className="transition-transform active:scale-95">
          <StatCard
            title="Assigned Tasks"
            value={String(stats.assignedTasks)}
            subtitle="Processing..."
            icon={<CheckSquare size={20} />}
          />
        </Link>

        <Link to="/intern/submissions" className="transition-transform active:scale-95">
          <StatCard
            title="Submissions"
            value={String(stats.pendingSubmissions).padStart(2, "0")}
            icon={<Folder size={20} />}
            subtitle="Pending Sync"
          />
        </Link>

        <Link to="/intern/meetings" className="transition-transform active:scale-95">
          <StatCard
            title="Neural Link"
            value={String(stats.meetings).padStart(2, "0")}
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

      {/* Optional: Visual Time Progress Bar Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Time Progress
        </h3>
        <div className="space-y-6">
          {/* Daily Progress */}
          <div>
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span className="text-white/60">Daily Progress</span>
              <span className="text-[#00d4ff] blue-glow">{dailyProgress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/10">
              <div
                className="bg-[#00d4ff] h-full rounded-full blue-glow shadow-[0_0_10px_rgba(0,212,255,1)]"
                style={{ width: `${Math.min(dailyProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div>
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span className="text-white/60">Weekly Progress</span>
              <span className="text-[#00d4ff] blue-glow">{weeklyProgress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/10">
              <div
                className="bg-[#00d4ff] h-full rounded-full blue-glow shadow-[0_0_10px_rgba(0,212,255,1)]"
                style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="gap-6">
        <RecentActivity />
      </div>
    </div>
  );
};

export default InternDashboard;
