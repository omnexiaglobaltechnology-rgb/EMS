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

const COLORS = ["#00d4ff", "#0066ff", "#6366f1"];

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
      <div className="animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-tight">
          Neural <span className="text-[#00d4ff] blue-glow">Analytics</span>
        </h1>
        <div className="flex items-center gap-4 mt-3">
          <div className="h-1 w-20 bg-[#00d4ff] rounded-full blue-glow"></div>
          <p className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">
            Real-time Performance Metrics
          </p>
        </div>
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

      <div className="card-glass relative overflow-hidden group border-white/5 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d4ff]/5 blur-[100px] rounded-full pointer-events-none"></div>
        <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
            <BarChart3 size={14} className="text-[#00d4ff]" />
            Performance <span className="text-[#00d4ff] blue-glow">Overview</span>
        </h2>

        <div className="space-y-12">
          {/* ================= TOP SECTION ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* LINE CHART - Task Completion Trend */}
            <div className="bg-white/5 rounded-3xl border border-white/5 p-6 backdrop-blur-md">
              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest">Efficiency Vector</h3>
                <span className="text-[10px] font-black text-[#00d4ff] blue-glow uppercase tracking-widest">↑ Optimizing</span>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metrics.taskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem" }}
                    itemStyle={{ color: "#00d4ff", fontSize: "12px", fontWeight: "900" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#00d4ff"
                    strokeWidth={4}
                    dot={{ r: 4, fill: "#00d4ff", strokeWidth: 0 }}
                    activeDot={{ r: 8, stroke: "rgba(0,212,255,0.2)", strokeWidth: 20 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* PIE CHART - Task Status */}
            <div className="bg-white/5 rounded-3xl border border-white/5 p-6 backdrop-blur-md">
              <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-6 px-2">Task Allocation</h3>

              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metrics.taskStatusData}
                    dataKey="value"
                    outerRadius={80}
                    innerRadius={50}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={9}
                    stroke="none"
                  >
                    {metrics.taskStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= BOTTOM SECTION ================= */}

          {/* BAR CHART - Member Productivity */}
          <div className="bg-white/5 rounded-3xl border border-white/5 p-6 backdrop-blur-md">
            <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-8 px-2">
              Individual Asset Productivity
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.memberPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem" }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="tasks" fill="#00d4ff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerAnalytics;
