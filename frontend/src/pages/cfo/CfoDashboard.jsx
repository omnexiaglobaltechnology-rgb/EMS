import { useEffect, useState } from "react";
import { AlertCircle, Loader } from "lucide-react";
import { tasksApi, submissionsApi } from "../../utils/api";

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
          const submissions = await submissionsApi.getByTask(task.id);
          allSubmissions.push(...submissions);
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
        revenue: `$${revenue}M`,
        expenses: `$${expenses}M`,
        profit: `$${profit}M`,
        runway: "14 Months",
      });

      // Generate activities
      const generatedActivities = [
        { title: "Q3 Budget Allocation Completed", progress: 95 },
        { title: "Department Expense Audit", progress: 80 },
        { title: "Vendor Cost Optimization Initiative", progress: 65 },
        { title: "Payroll & Compensation Review", progress: 55 },
        {
          title: "Annual Financial Forecast Planning",
          progress: Math.round((completedTasks / totalTasks) * 100),
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

export default CfoDashboard;
