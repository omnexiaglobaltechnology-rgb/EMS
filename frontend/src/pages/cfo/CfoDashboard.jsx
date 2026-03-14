import { useEffect, useState } from "react";
import { AlertCircle, Loader } from "lucide-react";
import { tasksApi, submissionsApi } from "../../utils/api";
import { useTheme } from "../../context/ThemeContext";

const MOTIVATIONAL_QUOTES = [
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
];

/**
 * Central landing dashboard for the CFO, presenting key financial KPIs.
 * Displays total revenue, operating expenses, net profit, and tracked initiatives.
 */
const CfoDashboard = () => {
  const [stats, setStats] = useState({
    revenue: "$0M",
    expenses: "$0M",
    profit: "$0M",
    runway: "0 Months",
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
   * Gathers task and submission data to calculate mocked financial indicators
   * and sets up the progress lists for active company-wide financial activities.
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
        } catch (err) {
          console.warn(`Could not fetch submissions for task ${task.id}`);
        }
      }

      // Calculate financial metrics (mock data based on real metrics)
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const revenue = (Math.random() * 20 + 5).toFixed(1);
      const expenses = (Math.random() * 10 + 2).toFixed(1);
      const profit = (revenue - expenses).toFixed(1);

      setStats({
        revenue: "$0",
        expenses: "$0",
        profit: "$0",
        runway: "0 Months",
      });

      // Generate activities
      const generatedActivities = []; // Future: Fetch from financeApi
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
    { label: "Total Revenue (YTD)", value: stats.revenue },
    { label: "Operating Expenses", value: stats.expenses },
    { label: "Net Profit", value: stats.profit },
    { label: "Cash Runway", value: stats.runway },
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
            <p className="mt-3 text-2xl text-emerald-500 font-bold tracking-tight">
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
            {activities.length > 0 ? activities.map((a) => (
              <div key={a.title}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>{a.title}</span>
                  <span className="text-slate-500 font-medium">{a.progress}%</span>
                </div>

                <div className={`h-2.5 w-full rounded-full ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"}`}>
                  <div
                    className="h-2.5 rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400 font-medium italic">No active financial initiatives tracked</p>
              </div>
            )}
          </div>
        </div>

        {/* Motivational Sidebar */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-200 mb-4">Financial Strategy</h2>
            <p className="text-xl font-medium leading-relaxed italic mb-4">"{quote.text}"</p>
            <p className="text-sm font-semibold text-emerald-200">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
};

export default CfoDashboard;
