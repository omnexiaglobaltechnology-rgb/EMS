import { TrendingUp, Users, BarChart3, Clock } from "lucide-react";

import MetricCard from "../../components/manager/MetricCard";

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
  CartesianGrid,
  Legend,
} from "recharts";

// ---------------Mock Data-----------------------------------
const taskTrendData = [
  { month: "Jan", completed: 45 },
  { month: "Feb", completed: 60 },
  { month: "Mar", completed: 75 },
  { month: "Apr", completed: 82 },
  { month: "May", completed: 90 },
  { month: "Jun", completed: 96 },
];

const taskStatusData = [
  { name: "Completed", value: 68 },
  { name: "In Progress", value: 22 },
  { name: "Pending", value: 10 },
];

const memberPerformanceData = [
  { name: "John", tasks: 28 },
  { name: "Sophia", tasks: 24 },
  { name: "Alex", tasks: 30 },
  { name: "Emma", tasks: 18 },
];

const COLORS = ["#4f46e5", "#22c55e", "#f59e0b"];

/**
 * Analytics view tailored for manager-intern level reporting.
 * Visualizes high-level productivity and team distribution metrics.
 */
const Manager_internAnalytics = () => {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Department performance metrics</p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Productivity"
          value="87%"
          change="+5%"
          icon={TrendingUp}
        />
        <MetricCard title="Team Size" value="45" change="+2" icon={Users} />
        <MetricCard
          title="Projects Completed"
          value="23"
          change="+8"
          icon={BarChart3}
        />
        <MetricCard
          title="Avg Response Time"
          value="2.4h"
          change="-0.5h"
          icon={Clock}
          negative
        />
      </div>

      {/* PERFORMANCE OVERVIEW */}
      <div className="rounded-xl border border-gray-300 bg-white p-6">
        <div className="rounded-xl border border-gray-300 bg-white p-6 space-y-8">
          <h2 className="text-xl font-semibold">Performance Overview</h2>

          {/* ================= TOP SECTION ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LINE CHART - Task Completion Trend */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">Team Task Completion Trend</h3>
                <span className="text-sm text-green-600">↑ Improving</span>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={taskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* PIE CHART - Task Status */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold mb-4">Task Status Distribution</h3>

              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    dataKey="value"
                    outerRadius={90}
                    label
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= BOTTOM SECTION ================= */}

          {/* BAR CHART - Member Productivity */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold mb-4">
              Individual Team Member Performance
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manager_internAnalytics;
