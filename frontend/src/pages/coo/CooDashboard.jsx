import React, { useEffect, useState } from "react";
import {
  Building2,
  Users2,
  ClipboardCheck,
  TrendingUp,
  Truck,
  ShieldAlert,
  Activity,
  AlertCircle,
  Loader,
} from "lucide-react";
import { tasksApi } from "../../utils/api";
import { useTheme } from "../../context/ThemeContext";

const MOTIVATIONAL_QUOTES = [
  { text: "Efficiency is doing things right; effectiveness is doing the right things.", author: "Peter Drucker" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
];

/**
 * Primary overview interface for the COO.
 * Summarizes systemic efficiency, live tasks, SLA compliance, and outlines potential logistical bottlenecks.
 */
const CooDashboard = () => {
  const [stats, setStats] = useState({
    efficiency: "0%",
    managers: 22,
    logistics: 46,
    slaCompliance: "0%",
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Executes asynchronous calls to retrieve system tasks, deriving operational completion rates
   * and generating a roster of ongoing strategic activities.
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const allTasks = await tasksApi.getAll();

      // Calculate operational metrics
      const completedTasks = allTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const totalTasks = allTasks.length;
      const efficiency =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setStats({
        efficiency: `${efficiency}%`,
        managers: "Active Nodes",
        logistics: "Tracking...",
        slaCompliance: "Compliance Hub",
      });

      const generatedActivities = [
        {
          title: "Supply Chain Bottleneck Mitigation",
          progress: 88,
          status: "Critical Phase",
        },
        {
          title: "Standard Operating Procedure (SOP) Audit",
          progress: 75,
          status: "In Progress",
        },
        {
          title: "Warehouse Automation Integration",
          progress: 65,
          status: "Testing",
        },
        {
          title: "Field Operations Safety Training",
          progress: 52,
          status: "Scheduled",
        },
        {
          title: "Operations Resource Re-allocation",
          progress: Math.min(100, efficiency + 20),
          status: totalTasks > 20 ? "Planning" : "Completed",
        },
      ];
      setActivities(generatedActivities);
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
      label: "Operational Efficiency",
      value: stats.efficiency,
      icon: <Activity size={20} className="text-emerald-500" />,
      themeColor: "text-emerald-500",
    },
    {
      label: "Resource Allocation",
      value: stats.managers,
      icon: <Users2 size={20} className="text-blue-500" />,
      themeColor: "text-blue-500",
    },
    {
      label: "Supply Logistics",
      value: stats.logistics,
      icon: <Truck size={20} className="text-amber-500" />,
      themeColor: "text-amber-500",
    },
    {
      label: "Service Compliance",
      value: stats.slaCompliance,
      icon: <ClipboardCheck size={20} className="text-indigo-500" />,
      themeColor: "text-indigo-500",
    },
  ];
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Operations Control Center
        </h1>
        <p className="text-slate-500">
          Real-time oversight of departmental performance and execution.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-5 shadow-sm transition-all ${
              theme === "dark" ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{s.label}</p>
                <p className={`mt-2 text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  {s.value}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/10`}
              >
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Department Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 rounded-xl border p-6 shadow-sm ${
          theme === "dark" ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Operations Strategy Progress</h2>
          </div>

          <div className="space-y-6">
            {activities.map((a) => (
              <div key={a.title}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>{a.title}</span>
                  <span className="text-slate-500 font-medium">{a.progress}%</span>
                </div>

                <div className={`h-2.5 w-full rounded-full ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"}`}>
                  <div
                    className="h-2.5 rounded-full bg-indigo-600 transition-all duration-1000 ease-out"
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivational Section */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-900 p-6 text-white shadow-lg shadow-indigo-700/20 flex flex-col justify-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-4">Operational Excellence</h2>
            <p className="text-xl font-medium leading-relaxed italic mb-4">"{quote.text}"</p>
            <p className="text-sm font-semibold text-indigo-300">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
};

export default CooDashboard;
