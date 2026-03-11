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
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChartIcon,
  AlertCircle,
  Loader,
} from "lucide-react";
import { tasksApi, submissionsApi } from "../../utils/api";

const METRIC_CARDS = [
  {
    title: "Revenue Growth",
    dataKey: "revenueGrowth",
    icon: TrendingUp,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Cost Efficiency",
    dataKey: "costEfficiency",
    icon: TrendingDown,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Market Position",
    dataKey: "marketPosition",
    icon: BarChart3,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Customer Satisfaction",
    dataKey: "customerSatisfaction",
    icon: PieChartIcon,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
];

const taskCompletionData = [
  { month: "Jan", value: 25 },
  { month: "Feb", value: 45 },
  { month: "Mar", value: 50 },
  { month: "Apr", value: 72 },
  { month: "May", value: 85 },
  { month: "Jun", value: 92 },
];

const meetingData = [
  { name: "Attended", value: 85 },
  { name: "Missed", value: 15 },
];

const departmentData = [
  { name: "Engineering", value: 95 },
  { name: "Marketing", value: 82 },
  { name: "Sales", value: 88 },
  { name: "Operations", value: 80 },
];

const COLORS = ["#4f46e5", "#e5e7eb"];

/**
 * Dashboard page displaying comprehensive company-wide analytics for the CEO.
 * Includes data visualizations for revenue, tasks, meetings, and department productivity.
 */
const CeoAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    revenueGrowth: "+32%",
    costEfficiency: "+15%",
    marketPosition: "#3",
    customerSatisfaction: "94%",
    taskCompletionData: [],
    meetingData: [],
    departmentData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  /**
   * Fetches raw tasks from the API and computes overarching completion,
   * performance, and pseudo-financial metrics for the analytics view.
   */
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const allTasks = await tasksApi.getAll();
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Generate 6-month trend data
      const taskCompletionData = [
        { month: "Jan", value: completionRate * 0.27 },
        { month: "Feb", value: completionRate * 0.49 },
        { month: "Mar", value: completionRate * 0.54 },
        { month: "Apr", value: completionRate * 0.78 },
        { month: "May", value: completionRate * 0.92 },
        { month: "Jun", value: completionRate },
      ];

      const meetingData = [
        { name: "Attended", value: 85 },
        { name: "Missed", value: 15 },
      ];

      const departmentData = [
        { name: "Engineering", value: Math.min(95, completionRate + 5) },
        { name: "Marketing", value: Math.min(82, completionRate - 8) },
        { name: "Sales", value: Math.min(88, completionRate - 2) },
        { name: "Operations", value: Math.min(80, completionRate - 10) },
      ];

      setAnalyticsData({
        revenueGrowth: `+${Math.floor(Math.random() * 20 + 20)}%`,
        costEfficiency: `+${Math.floor(Math.random() * 15 + 10)}%`,
        marketPosition: "#3",
        customerSatisfaction: `${Math.min(99, completionRate + 10)}%`,
        taskCompletionData,
        meetingData,
        departmentData,
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
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-slate-500">Company wide Analytics</p>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {METRIC_CARDS.map((item, index) => {
          const Icon = item.icon;
          const value = analyticsData[item.dataKey];

          return (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {value}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg}`}
                >
                  <Icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LINE CHART */}
      <div className="rounded-xl border border-gray-300 bg-white p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Task Completion Rate</h3>
          <span className="font-semibold">92%</span>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={analyticsData.taskCompletionData}>
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
        {/* DONUT */}
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <h3 className="font-semibold mb-4">Meeting Participation</h3>

          <div className="flex justify-center">
            <ResponsiveContainer width={250} height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.meetingData}
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                >
                  {analyticsData.meetingData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between text-sm mt-4">
            <span>Attended: 85%</span>
            <span>Missed: 15%</span>
          </div>
        </div>

        {/* BAR CHART */}
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <h3 className="font-semibold mb-4">Department Productivity</h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData.departmentData} layout="vertical">
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

export default CeoAnalytics;
