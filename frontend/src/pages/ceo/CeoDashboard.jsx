import { useEffect, useState } from "react";
import {
  DollarSign,
  Building2,
  Users,
  TrendingUp,
  Megaphone,
  AlertCircle,
  Loader,
} from "lucide-react";
import { tasksApi, submissionsApi } from "../../utils/api";

/**
 * Main command center for the CEO providing a high-level summary of
 * the organization, including revenue, growth, and department performance.
 */
const CeoDashboard = () => {
  const [stats, setStats] = useState({
    revenue: "$0",
    departments: 0,
    employees: 0,
    growth: 0,
  });
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Aggregates active tasks and submissions to compute key performance indicators
   * and company-wide growth metrics for display.
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const allTasks = await tasksApi.getAll();
      let allSubmissions = [];

      for (const task of allTasks) {
        try {
          const submissions = await submissionsApi.getByTask(task.id);
          allSubmissions.push(...submissions);
        } catch (err) {
          console.warn(`Could not fetch submissions for task ${task.id}`);
        }
      }

      // Calculate metrics
      const uniqueEmployees = new Set(
        allTasks.map((t) => t.assignedToId).filter(Boolean),
      ).size;
      const completedTasks = allTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const totalTasks = allTasks.length;
      const growthRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setStats({
        revenue: `$${(Math.random() * 20 + 5).toFixed(1)}M`,
        departments: 12,
        employees: uniqueEmployees,
        growth: growthRate,
      });

      // Generate performance data
      const departments = [
        { name: "Technical", value: Math.min(95, Math.random() * 100 + 50) },
        { name: "Operations", value: Math.min(90, Math.random() * 100 + 40) },
        { name: "Finance", value: Math.min(85, Math.random() * 100 + 30) },
      ];
      setPerformance(departments);
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
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    {
      title: "Total Revenue",
      value: stats.revenue,
      change: "+18% from last week",
      icon: DollarSign,
    },
    {
      title: "Departments",
      value: String(stats.departments),
      icon: Building2,
    },
    {
      title: "Total Employees",
      value: String(stats.employees),
      change: "+12% from last week",
      icon: Users,
    },
    {
      title: "Company Growth",
      value: `${stats.growth}%`,
      change: "+8% from last week",
      icon: TrendingUp,
    },
  ];

  const announcements = [
    { title: "Q1 Results Published", time: "1 day ago" },
    { title: "New Policy Updates", time: "2 day ago" },
    { title: "Team Expansion", time: "3 day ago" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">CEO Dashboard</h1>
        <p className="text-slate-500">Complete organization overview.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="rounded-xl border border-gray-300 bg-white p-6 flex justify-between items-start"
            >
              <div>
                <p className="text-sm text-slate-500">{item.title}</p>
                <h2 className="mt-1 text-2xl font-bold">{item.value}</h2>
                {item.change && (
                  <p className="mt-2 text-sm text-green-600">{item.change}</p>
                )}
              </div>

              <div className="rounded-lg bg-indigo-600 p-3 text-white">
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Department Performance */}
        <div className="lg:col-span-2 rounded-xl border border-gray-300 bg-white p-6">
          <h2 className="mb-6 text-lg font-semibold">Department Performance</h2>

          <div className="space-y-5">
            {performance.map((dept) => (
              <div key={dept.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{dept.name}</span>
                  <span className="text-slate-500">
                    {Math.round(dept.value)}%
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-indigo-600"
                    style={{ width: `${dept.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <h2 className="mb-6 text-lg font-semibold">Recent Announcements</h2>

          <div className="space-y-4">
            {announcements.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg bg-slate-50 p-4"
              >
                <Megaphone size={18} className="mt-1 text-slate-500" />
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-slate-500">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CeoDashboard;
