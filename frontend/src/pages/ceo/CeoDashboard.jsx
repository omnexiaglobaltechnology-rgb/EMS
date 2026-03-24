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
import { useTheme } from "../../context/ThemeContext";

const MOTIVATIONAL_QUOTES = [
  { text: "Leadership is not about being in charge. It is about taking care of those in your charge.", author: "Simon Sinek" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.", author: "Ronald Reagan" },
];

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
  const { theme } = useTheme();

  const [quote] = useState(() => 
    MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
  );

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
          const taskId = task.id || task._id;
          if (!taskId) continue;
          const taskSubmissions = await submissionsApi.getByTask(taskId);
          allSubmissions.push(...taskSubmissions);
        } catch (_err) {
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
        revenue: "$0", // Future: Fetch from finance module
        departments: 0, // Should be fetched from departmentsApi
        employees: uniqueEmployees,
        growth: growthRate,
      });

      // Generate performance data
      const departments = [
        { name: "Technical", value: growthRate > 0 ? growthRate : 0 },
        { name: "Operations", value: growthRate > 5 ? growthRate - 5 : 0 },
        { name: "Finance", value: growthRate > 10 ? growthRate - 10 : 0 },
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

  const announcements = []; // Future: Fetch from announcementsApi

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
              className={`rounded-xl border p-6 flex justify-between items-start transition-all shadow-sm ${
                theme === "dark" 
                  ? "bg-[#1E293B] border-slate-700 hover:border-indigo-500/50" 
                  : "bg-white border-gray-200 hover:border-indigo-500/50 shadow-slate-200/50"
              }`}
            >
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{item.title}</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">{item.value}</h2>
                {item.change && (
                  <p className="mt-2 text-sm text-indigo-500 font-medium">{item.change}</p>
                )}
              </div>

              <div className="rounded-xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-600/20">
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Department Performance */}
        <div className={`lg:col-span-2 rounded-xl border p-6 shadow-sm ${
          theme === "dark" ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"
        }`}>
          <h2 className="mb-6 text-lg font-semibold">Department Performance</h2>

          <div className="space-y-5">
            {performance.map((dept) => (
              <div key={dept.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>{dept.name}</span>
                  <span className="text-slate-500">
                    {Math.round(dept.value)}%
                  </span>
                </div>

                <div className={`h-2 w-full rounded-full ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"}`}>
                  <div
                    className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${dept.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivation and Announcements */}
        <div className="space-y-6">
          {/* Motivational Quote Card */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white shadow-lg shadow-indigo-600/20">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-4 italic">Daily Inspiration</h2>
            <p className="text-lg font-medium leading-relaxed mb-4">&quot;{quote.text}&quot;</p>
            <p className="text-xs font-semibold text-indigo-200">— {quote.author}</p>
          </div>

          <div className={`rounded-xl border p-6 shadow-sm ${
            theme === "dark" ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"
          }`}>
            <h2 className="mb-6 text-lg font-semibold">Recent Announcements</h2>

            <div className="space-y-4">
              {announcements.length > 0 ? announcements.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg p-4 ${
                    theme === "dark" ? "bg-slate-800/50" : "bg-slate-50"
                  }`}
                >
                  <Megaphone size={18} className="mt-1 text-slate-500" />
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.time}</p>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center">
                  <Megaphone size={24} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No recent announcements</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CeoDashboard;
