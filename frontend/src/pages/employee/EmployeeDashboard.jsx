import { useEffect, useState, useCallback } from "react";
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
import { tasksApi } from "../../utils/api";

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
  }, [fetchDashboardData]);

  const fetchDashboardData = useCallback(async () => {
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
  }, [userId]);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Welcome back, {name || "Employee"}!
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Here&apos;s your employee portal summary.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Link to="/employee/my-tasks">
          <StatCard
            title="My Tasks"
            value={String(stats.assignedTasks)}
            subtitle="Active tasks"
            icon={<CheckSquare />}
            bg="bg-indigo-50"
            iconBg="bg-indigo-100 text-indigo-600"
            border="border-indigo-200"
          />
        </Link>

        <Link to="/employee/submissions">
          <StatCard
            title="Submissions"
            value={String(stats.pendingSubmissions)}
            icon={<Folder />}
            subtitle="Under review"
            bg="bg-sky-50"
            iconBg="bg-sky-100 text-sky-600"
            border="border-sky-200"
          />
        </Link>

        <Link to="/employee/meetings">
          <StatCard
            title="Meetings"
            value={String(stats.meetings)}
            icon={<Calendar />}
            subtitle="Today"
            bg="bg-emerald-50"
            iconBg="bg-emerald-100 text-emerald-600"
            border="border-emerald-200"
          />
        </Link>

        <StatCard
          title="Worked Today"
          value={stats.workedToday}
          subtitle="Goal: 8h"
          icon={<Timer />}
          bg="bg-yellow-50"
          iconBg="bg-yellow-100 text-yellow-600"
          border="border-yellow-200"
        />

        <StatCard
          title="This Week"
          value={stats.workedThisWeek}
          subtitle="Goal: 40h"
          icon={<BarChart3 />}
          bg="bg-purple-50"
          iconBg="bg-purple-100 text-purple-600"
          border="border-purple-200"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Performance</h3>
        <p className="text-slate-500 text-sm">Real-time performance metrics will appear here.</p>
      </div>

      <RecentActivity />
    </div>
  );
};

export default EmployeeDashboard;
