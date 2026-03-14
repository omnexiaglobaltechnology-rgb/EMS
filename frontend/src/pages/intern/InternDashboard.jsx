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
  const { id: internId } = useSelector((state) => state.auth);

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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* 1. Assigned Tasks */}
        <Link to="/intern/my-tasks">
          <StatCard
            title="Assigned Tasks"
            value={String(stats.assignedTasks)}
            subtitle="Active tasks pending"
            icon={<CheckSquare />}
            bg="bg-indigo-50"
            iconBg="bg-indigo-100 text-indigo-600"
            border="border-indigo-200"
          />
        </Link>

        {/* 2. Pending Submissions */}
        <Link to="/intern/submissions">
          <StatCard
            title="Submissions"
            value={String(stats.pendingSubmissions).padStart(2, "0")}
            icon={<Folder />}
            subtitle="Awaiting review"
            bg="bg-sky-50"
            iconBg="bg-sky-100 text-sky-600"
            border="border-sky-200"
          />
        </Link>

        {/* 3. Meetings */}
        <Link to="/intern/meetings">
          <StatCard
            title="Meetings"
            value={String(stats.meetings).padStart(2, "0")}
            icon={<Calendar />}
            subtitle="Scheduled for today"
            bg="bg-emerald-50"
            iconBg="bg-emerald-100 text-emerald-600"
            border="border-emerald-200"
          />
        </Link>

        {/* 4. DAILY WORK HOURS */}
        <div className="cursor-default">
          <StatCard
            title="Worked Today"
            value={stats.workedToday}
            subtitle="Daily Goal: 8h"
            icon={<Timer />}
            bg="bg-yellow-50"
            iconBg="bg-yellow-100 text-yellow-600"
            border="border-yellow-200"
          />
        </div>

        {/* 5. WEEKLY WORK HOURS */}
        <div className="cursor-default">
          <StatCard
            title="Worked This Week"
            value={stats.workedThisWeek}
            subtitle="Weekly Goal: 40h"
            icon={<BarChart3 />}
            bg="bg-purple-50"
            iconBg="bg-purple-100 text-purple-600"
            border="border-purple-200"
          />
        </div>
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
              <span className="text-slate-600">Daily Progress</span>
              <span className="text-indigo-600">{dailyProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${Math.min(dailyProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div>
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span className="text-slate-600">Weekly Progress (Week 02)</span>
              <span className="text-emerald-600">{weeklyProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-emerald-600 h-2.5 rounded-full"
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
