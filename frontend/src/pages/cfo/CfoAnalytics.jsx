import { useEffect, useState } from "react";
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
} from "recharts";
import { AlertCircle, Loader } from "lucide-react";
import { tasksApi } from "../../utils/api";

/**
 * High-level analytics dashboard for the Chief Financial Officer.
 * Visualizes revenue, expenses, and budgetary trends using rechart components.
 */
const CfoAnalytics = () => {
  const [metrics, setMetrics] = useState({
    revenue: "$10.2M",
    expenses: "$6.8M",
    revenueGrowthData: [],
    financeMeetingData: [],
    budgetUtilizationData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ["#4f46e5", "#e5e7eb"];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  /**
   * Pulls task data to simulate financial metrics, compiling them into
   * specific formats required by the charting library (Line, Pie, Bar).
   */
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const allTasks = await tasksApi.getAll();

      // Simulate revenue based on task count
      const baseRevenue = 5 + Math.random() * 15;
      const revenue = baseRevenue.toFixed(1);
      const expenses = (baseRevenue * 0.6).toFixed(1);

      // Generate revenue growth trend
      const revenueGrowthData = [
        { month: "Jan", value: 6.2 },
        { month: "Feb", value: 6.8 },
        { month: "Mar", value: 7.4 },
        { month: "Apr", value: 8.1 },
        { month: "May", value: 9.3 },
        { month: "Jun", value: parseFloat(revenue) },
      ];

      const completedReviews = Math.round(
        (allTasks.filter((t) => t.status === "completed").length /
          allTasks.length) *
          100,
      );

      const financeMeetingData = [
        { name: "Completed Reviews", value: completedReviews },
        { name: "Pending Reviews", value: 100 - completedReviews },
      ];

      const budgetUtilizationData = [
        { name: "Engineering", value: 82 },
        { name: "Sales", value: 88 },
        { name: "Marketing", value: 75 },
        { name: "Operations", value: 80 },
      ];

      setMetrics({
        revenue: `$${revenue}M`,
        expenses: `$${expenses}M`,
        revenueGrowthData,
        financeMeetingData,
        budgetUtilizationData,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div>
          <p className="font-medium text-red-900">Error loading analytics</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">CFO Analytics</h1>
        <p className="text-slate-500">
          Financial performance & budget insights
        </p>
      </div>

      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
          <p className="text-slate-500">Financial Health</p>
          <h2 className="text-4xl font-bold">{metrics.revenue}</h2>
          <p className="text-green-600 text-sm mt-1">
            ↑ Revenue growth this quarter
          </p>
        </div>

        <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
          <p className="text-slate-500">Operating Expenses</p>
          <h2 className="text-4xl font-bold">{metrics.expenses}</h2>
          <p className="text-slate-500 text-sm mt-1">Within approved budget</p>
        </div>
      </div>

      {/* LINE CHART */}
      <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Revenue Growth Trend ($M)</h3>
          <span className="font-semibold text-indigo-600">
            {metrics.revenue}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={metrics.revenueGrowthData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DONUT CHART */}
        <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Financial Review Completion</h3>

          <div className="flex justify-center">
            <ResponsiveContainer width={250} height={250}>
              <PieChart>
                <Pie
                  data={metrics.financeMeetingData}
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                >
                  {metrics.financeMeetingData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between text-sm mt-4 text-slate-600">
            <span>Completed: {metrics.financeMeetingData[0]?.value || 0}%</span>
            <span>Pending: {metrics.financeMeetingData[1]?.value || 0}%</span>
          </div>
        </div>

        {/* BAR CHART */}
        <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">
            Department Budget Utilization (%)
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metrics.budgetUtilizationData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CfoAnalytics;
