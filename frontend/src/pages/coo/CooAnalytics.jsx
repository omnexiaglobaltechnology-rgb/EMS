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

const operationsEfficiencyData = [
  { month: "Jan", value: 60 },
  { month: "Feb", value: 65 },
  { month: "Mar", value: 70 },
  { month: "Apr", value: 78 },
  { month: "May", value: 85 },
  { month: "Jun", value: 90 },
];

const complianceData = [
  { name: "Compliant", value: 88 },
  { name: "Non-Compliant", value: 12 },
];

const operationsDeptData = [
  { name: "Logistics", value: 92 },
  { name: "Supply Chain", value: 88 },
  { name: "Quality Control", value: 90 },
  { name: "Procurement", value: 85 },
];

const COLORS = ["#4f46e5", "#e5e7eb"];

/**
 * Performance and efficiency analytics dashboard for the Chief Operating Officer.
 * Renders crucial operational metrics utilizing various charting visualizations.
 */
const CooAnalytics = () => {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Operations Analytics</h1>
        <p className="text-slate-500">
          Operations performance & efficiency metrics
        </p>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <p className="text-slate-500">Operational Efficiency</p>
          <h2 className="text-4xl font-bold">90%</h2>
          <p className="text-green-600 text-sm mt-1">
            ↑ +5% improvement this quarter
          </p>
        </div>

        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <p className="text-slate-500">Active Operations Tasks</p>
          <h2 className="text-4xl font-bold">126</h2>
          <p className="text-slate-500 text-sm mt-1">102 running smoothly</p>
        </div>
      </div>

      {/* LINE CHART */}
      <div className="rounded-xl border border-gray-300 bg-white p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Operational Efficiency Rate</h3>
          <span className="font-semibold">90%</span>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={operationsEfficiencyData}>
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
          <h3 className="font-semibold mb-4">Process Compliance</h3>

          <div className="flex justify-center">
            <ResponsiveContainer width={250} height={250}>
              <PieChart>
                <Pie
                  data={complianceData}
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                >
                  {complianceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between text-sm mt-4">
            <span>Compliant: 88%</span>
            <span>Non-Compliant: 12%</span>
          </div>
        </div>

        {/* BAR CHART */}
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <h3 className="font-semibold mb-4">
            Operations Sub-Department Productivity
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={operationsDeptData} layout="vertical">
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

export default CooAnalytics;
