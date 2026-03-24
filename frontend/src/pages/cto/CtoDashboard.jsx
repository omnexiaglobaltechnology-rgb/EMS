import { useEffect, useState } from "react";
import { AlertCircle, Loader } from "lucide-react";
import { tasksApi } from "../../utils/api";
import { useTheme } from "../../context/ThemeContext";

const MOTIVATIONAL_QUOTES = [
  { text: "Great things in business are never done by one person. They're done by a team of people.", author: "Steve Jobs" },
  { text: "The advance of technology is based on making it fit in so that you don't even notice it, so it's part of everyday life.", author: "Bill Gates" },
];

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
  const { theme } = useTheme();
  const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

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
        engineers: "Calculating Team Size...",
        managers: "Active Units",
        leads: "Lead Units",
        interns: "Talent Pipeline",
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
    } catch (_err) {
      console.error("Error fetching dashboard data:", _err);
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
            className={`rounded-xl border p-5 shadow-sm transition-all ${
              theme === "dark" ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 font-medium">{s.label}</p>
            </div>
            <p className="mt-3 text-2xl text-blue-500 font-bold tracking-tight">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Organization Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 rounded-xl border p-6 shadow-sm ${
          theme === "dark" ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"
        }`}>
          <h2 className="text-lg font-semibold mb-6">Organization Activity Overview</h2>

          <div className="space-y-5">
            {activities.map((a) => (
              <div key={a.title}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>{a.title}</span>
                  <span className="text-slate-500 font-medium">{a.progress}%</span>
                </div>

                <div className={`h-2.5 w-full rounded-full ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"}`}>
                  <div
                    className="h-2.5 rounded-full bg-blue-500 transition-all duration-700"
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivational Sidebar */}
        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-4">Engineering Vision</h2>
            <p className="text-xl font-medium leading-relaxed italic mb-4">&quot;{quote.text}&quot;</p>
            <p className="text-sm font-semibold text-blue-200">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
};

export default CtoDashboard;
