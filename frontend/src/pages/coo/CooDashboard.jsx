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
        managers: 22,
        logistics: 46,
        slaCompliance: Math.min(99, efficiency + 10).toFixed(1) + "%",
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
      icon: <Activity size={20} className="text-emerald-600" />,
      bgColor: "bg-emerald-100",
    },
    {
      label: "Total Ops Managers",
      value: stats.managers,
      icon: <Users2 size={20} className="text-blue-600" />,
      bgColor: "bg-blue-100",
    },
    {
      label: "Active Logistics Units",
      value: stats.logistics,
      icon: <Truck size={20} className="text-amber-600" />,
      bgColor: "bg-amber-100",
    },
    {
      label: "SLA Compliance",
      value: stats.slaCompliance,
      icon: <ClipboardCheck size={20} className="text-indigo-600" />,
      bgColor: "bg-indigo-100",
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
            className="rounded-xl border border-gray-300 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{s.label}</p>
                <p className="mt-2 text-3xl text-slate-900 font-bold">
                  {s.value}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bgColor}`}
              >
                {s.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-emerald-600">
              <TrendingUp size={14} className="mr-1" />
              <span>+2.4% from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Department Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">
              Operations Strategy Progress
            </h2>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase">
              Q1 Focus
            </span>
          </div>

          <div className="space-y-6">
            {activities.map((a) => (
              <div key={a.title}>
                <div className="mb-2 flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">
                      {a.title}
                    </span>
                    <span className="text-xs text-slate-400">{a.status}</span>
                  </div>
                  <span className="font-bold text-slate-600">
                    {Math.round(a.progress)}%
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2.5 rounded-full bg-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operations Alerts Section */}
        <div className="rounded-xl border border-red-200 bg-red-50/30 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-red-700">
            <ShieldAlert size={20} />
            <h2 className="font-bold text-lg">Critical Escalations</h2>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-white border border-red-100 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-red-600 uppercase">
                Logistics
              </p>
              <p className="text-sm font-medium text-slate-800">
                Delayed shipment in Sector 7 affecting SLA.
              </p>
              <p className="text-[10px] text-slate-400 mt-1">24 mins ago</p>
            </div>
            <div className="p-3 bg-white border border-red-100 rounded-lg shadow-sm opacity-80">
              <p className="text-xs font-bold text-amber-600 uppercase">
                Facility
              </p>
              <p className="text-sm font-medium text-slate-800">
                Maintenance scheduled for Main Hub.
              </p>
              <p className="text-[10px] text-slate-400 mt-1">2 hours ago</p>
            </div>
            <button className="w-full py-2 text-sm font-semibold text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
              View All Incidents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CooDashboard;
