import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  AlertCircle,
  Loader,
} from "lucide-react";

import MetricCard from "../../components/manager/MetricCard";
import { tasksApi } from "../../utils/api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#4f46e5", "#22c55e", "#f59e0b"];

/**
 * Analytics dashboard for department managers.
 * Visualizes team productivity, task distribution, and individual performance.
 */
const ManagerAnalytics = () => {
  const [metrics, setMetrics] = useState({
    productivity: 0,
    teamSize: 0,
    projectsCompleted: 0,
    avgResponseTime: "0h",
    taskTrendData: [],
    taskStatusData: [],
    memberPerformanceData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  /**
   * Aggregates task data via API to generate performance metrics.
   * Computes productivity rates, team size, and identifies top performers.
   */
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const allTasks = await tasksApi.getAll();

      // Calculate metrics
      const completed = allTasks.filter((t) => t.status === "completed").length;
      const inProgress = allTasks.filter(
        (t) => t.status === "in_progress",
      ).length;
      const pending = allTasks.filter((t) => t.status === "pending").length;
      const total = allTasks.length;

      const uniqueEmployees = new Set(
        allTasks.map((t) => t.assignedToId).filter(Boolean),
      ).size;
      const productivity =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      // Task status distribution
      const taskStatusData = [
        { name: "Completed", value: completed },
        { name: "In Progress", value: inProgress },
        { name: "Pending", value: pending },
      ].filter((d) => d.value > 0);

      // Generate trend data (last 6 months simulation)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      const taskTrendData = months.map((month, idx) => ({
        month,
        completed: Math.round((completed * (idx + 1)) / 6),
      }));

      // Member performance (top performers by task count)
      const memberTasks = {};
      allTasks.forEach((task) => {
        if (task.assignedToId) {
          memberTasks[task.assignedToId] =
            (memberTasks[task.assignedToId] || 0) + 1;
        }
      });

      const memberPerformanceData = Object.entries(memberTasks)
        .map(([name, tasks]) => ({
          name: name.replace("intern-", "Int. "),
          tasks,
        }))
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 4);

      setMetrics({
        productivity,
        teamSize: uniqueEmployees,
        projectsCompleted: completed,
        avgResponseTime: "2.4h",
        taskTrendData,
        taskStatusData,
        memberPerformanceData:
          memberPerformanceData.length > 0
            ? memberPerformanceData
            : [{ name: "No Data", tasks: 0 }],
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Department performance metrics</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Productivity"
          value={`${metrics.productivity}%`}
          change="+5%"
          icon={TrendingUp}
        />
        <MetricCard
          title="Team Size"
          value={String(metrics.teamSize)}
          change="+2"
          icon={Users}
        />
        <MetricCard
          title="Projects Completed"
          value={String(metrics.projectsCompleted)}
          change="+8"
          icon={BarChart3}
        />
        <MetricCard
          title="Avg Response Time"
          value={metrics.avgResponseTime}
          change="-0.5h"
          icon={Clock}
          negative
        />
      </div>

      {/* PERFORMANCE OVERVIEW */}
      <div className="rounded-xl border border-gray-300 bg-white p-6">
        <div className="rounded-xl border border-gray-300 bg-white p-6 space-y-8">
          <h2 className="text-xl font-semibold">Performance Overview</h2>

          {/* ================= TOP SECTION ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LINE CHART - Task Completion Trend */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">Team Task Completion Trend</h3>
                <span className="text-sm text-green-600">↑ Improving</span>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metrics.taskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* PIE CHART - Task Status */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold mb-4">Task Status Distribution</h3>

              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metrics.taskStatusData}
                    dataKey="value"
                    outerRadius={90}
                    label
                  >
                    {metrics.taskStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= BOTTOM SECTION ================= */}

          {/* BAR CHART - Member Productivity */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold mb-4">
              Individual Team Member Performance
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.memberPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerAnalytics;
