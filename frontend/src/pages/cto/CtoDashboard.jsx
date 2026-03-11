import { useEffect, useState } from "react";
import { AlertCircle, Loader } from "lucide-react";
import { tasksApi } from "../../utils/api";

/**
 * Strategic engineering control center for the CTO.
 * Provides a high-level census of technical personnel and tracks core architectural initiatives.
 */
const CtoDashboard = () => {
  const [stats, setStats] = useState({
    engineers: 0,
    managers: 0,
    leads: 0,
    interns: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Requisitions departmental task data to derive completion percentages
   * and compiles a roadmap of key engineering activities.
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const allTasks = await tasksApi.getAll();
      const completedCount = allTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const totalCount = allTasks.length;

      setStats({
        engineers: 86,
        managers: 12,
        leads: 18,
        interns: 34,
      });

      const generatedActivities = [
        { title: "System Architecture Revamp (Microservices)", progress: 85 },
        { title: "Cloud Cost Optimization Initiative", progress: 72 },
        { title: "DevOps CI/CD Pipeline Upgrade", progress: 65 },
        { title: "Engineering Intern Onboarding Program", progress: 55 },
        {
          title: "Legacy System Migration to AWS",
          progress:
            totalCount > 0
              ? Math.round((completedCount / totalCount) * 100)
              : 40,
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

  const statsArray = [
    { label: "Engineering Employees", value: stats.engineers },
    { label: "Technical Managers", value: stats.managers },
    { label: "Team Leads", value: stats.leads },
    { label: "Engineering Interns", value: stats.interns },
  ];
  return (
    <div className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsArray.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-300 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
            <p className="mt-3 text-2xl text-[#2B7FFF] font-semibold">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Organization Activity Overview */}
      <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          Organization Activity Overview
        </h2>

        <div className="space-y-4">
          {activities.map((a) => (
            <div key={a.title}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-700">{a.title}</span>
                <span className="text-slate-500">{a.progress}%</span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${a.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CtoDashboard;
