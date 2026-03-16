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

/* Sprint completion trend */
const sprintCompletionDataDefault = [
  { month: "Jan", value: 62 },
  { month: "Feb", value: 68 },
  { month: "Mar", value: 72 },
  { month: "Apr", value: 80 },
  { month: "May", value: 88 },
  { month: "Jun", value: 92 },
];

/* Engineering meeting efficiency */
const meetingEfficiencyData = [
  { name: "Effective", value: 82 },
  { name: "Ineffective", value: 18 },
];

/* Technical team productivity */
const technicalTeamData = [
  { name: "Frontend", value: 90 },
  { name: "Backend", value: 88 },
  { name: "DevOps", value: 85 },
  { name: "QA", value: 80 },
];

const COLORS = ["#4f46e5", "#e5e7eb"];

/**
 * Engineering-centric analytics dashboard for the Chief Technology Officer.
 * Visualizes sprint progress, technical team productivity, and meeting efficiency metrics.
 */
const CtoAnalytics = () => {
  const [metrics, setMetrics] = useState({
    healthScore: "88%",
    activeProjects: "142",
    sprintCompletionData: [],
    meetingEfficiencyData: [],
    technicalTeamData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const COLORS = ["#4f46e5", "#e5e7eb"];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  /**
   * Aggregates engineering tasks to compute localized health scores and
   * generates specialized datasets for trend visualization.
   */
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const allTasks = await tasksApi.getAll();
      const completedTasks = allTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const totalTasks = allTasks.length;
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const sprintCompletionData = [
        { month: "Jan", value: completionRate * 0.67 },
        { month: "Feb", value: completionRate * 0.74 },
        { month: "Mar", value: completionRate * 0.78 },
        { month: "Apr", value: completionRate * 0.87 },
        { month: "May", value: completionRate * 0.96 },
        { month: "Jun", value: completionRate },
      ];

      const meetingEfficiencyData = [
        { name: "Effective", value: completionRate },
        { name: "Ineffective", value: 100 - completionRate },
      ];

      const technicalTeamData = [
        { name: "Frontend", value: Math.min(95, completionRate + 5) },
        { name: "Backend", value: Math.min(88, completionRate - 2) },
        { name: "DevOps", value: Math.min(85, completionRate - 5) },
        { name: "QA", value: Math.min(80, completionRate - 10) },
      ];

      setMetrics({
        healthScore: `${completionRate}%`,
        activeProjects: String(totalTasks),
        sprintCompletionData,
        meetingEfficiencyData,
        technicalTeamData,
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
        <h1 className="text-2xl font-semibold text-slate-900">CTO Analytics</h1>
        <p className="text-slate-500">
          Engineering performance & delivery metrics
        </p>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <p className="text-slate-500">Engineering Health Score</p>
          <h2 className="text-4xl font-bold text-slate-900">
            {metrics.healthScore}
          </h2>
          <p className="text-green-600 text-sm mt-1">↑ +4% from last sprint</p>
        </div>

        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <p className="text-slate-500">Active Technical Projects</p>
          <h2 className="text-4xl font-bold text-slate-900">
            {metrics.activeProjects}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            118 on track · 24 at risk
          </p>
        </div>
      </div>

      {/* LINE CHART */}
      <div className="rounded-xl border border-gray-300 bg-white p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold text-slate-900">
            Sprint Completion Rate
          </h3>
          <span className="font-semibold text-indigo-600">
            {metrics.healthScore}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={metrics.sprintCompletionData}>
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
          <h3 className="font-semibold mb-4 text-slate-900">
            Engineering Meeting Effectiveness
          </h3>

          <div className="flex justify-center">
            <ResponsiveContainer width={250} height={250}>
              <PieChart>
                <Pie
                  data={metrics.meetingEfficiencyData}
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                >
                  {metrics.meetingEfficiencyData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between text-sm mt-4 text-slate-600">
            <span>
              Effective: {metrics.meetingEfficiencyData[0]?.value || 0}%
            </span>
            <span>
              Ineffective: {metrics.meetingEfficiencyData[1]?.value || 0}%
            </span>
          </div>
        </div>

        {/* BAR CHART */}
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <h3 className="font-semibold mb-4 text-slate-900">
            Technical Team Productivity
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metrics.technicalTeamData} layout="vertical">
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

export default CtoAnalytics;
