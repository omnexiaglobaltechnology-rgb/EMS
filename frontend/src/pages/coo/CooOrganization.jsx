// COO Analytics and Organization Intelligence Page
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
} from "recharts";
import { TrendingUp, Clock, AlertCircle } from "lucide-react";

/* Operational SLA Adherence Trend (%) */
const slaAdherenceData = [
  { month: "Jan", value: 88 },
  { month: "Feb", value: 85 },
  { month: "Mar", value: 89 },
  { month: "Apr", value: 92 },
  { month: "May", value: 90 },
  { month: "Jun", value: 95 },
];

/* Operations Budget Utilization */
const budgetData = [
  { name: "Utilized", value: 72 },
  { name: "Remaining", value: 28 },
];

/* Procurement & Logistics Cycle Time (Days) */
const logisticsEfficiencyData = [
  { name: "Sourcing", value: 12 },
  { name: "Transit", value: 18 },
  { name: "Warehousing", value: 8 },
  { name: "Distribution", value: 14 },
];

const COLORS = ["#4f46e5", "#e2e8f0"];

/**
 * Supplemental operational intelligence dashboard tailored towards logistics,
 * budgetary spending rates, and SLA adherence trends for the COO.
 */
const CooAnalytics = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Operational Intelligence
        </h1>
        <p className="text-slate-500">
          Data-driven insights into supply chain and execution metrics.
        </p>
      </div>

      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500">
              Avg. Fulfillment Time
            </p>
            <Clock size={18} className="text-indigo-500" />
          </div>
          <h2 className="text-3xl font-bold mt-2">4.2 Days</h2>
          <p className="text-emerald-600 text-xs font-semibold mt-2 flex items-center">
            <TrendingUp size={14} className="mr-1" /> 12% faster than Q4
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500">
              Active Procurement Rows
            </p>
            <TrendingUp size={18} className="text-indigo-500" />
          </div>
          <h2 className="text-3xl font-bold mt-2">1,240</h2>
          <p className="text-slate-500 text-xs mt-2">88% automated via ERP</p>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50/50 p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-red-600">
              Pending Escalations
            </p>
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-bold mt-2 text-red-700">14</h2>
          <p className="text-red-600 text-xs font-semibold mt-2 underline cursor-pointer">
            Require COO Sign-off →
          </p>
        </div>
      </div>

      {/* MAIN CHART: SLA ADHERENCE */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="font-bold text-slate-800">SLA Adherence Trend</h3>
          <p className="text-xs text-slate-400">
            Monthly percentage of operational tasks meeting deadline targets.
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={slaAdherenceData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4f46e5"
              strokeWidth={4}
              dot={{ r: 6, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LOGISTICS EFFICIENCY BAR CHART */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">
            Logistics Cycle Breakdown (Days)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={logisticsEfficiencyData}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontWeight: 500 }}
              />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar
                dataKey="value"
                fill="#6366f1"
                radius={[0, 8, 8, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* OPERATIONAL BUDGET DONUT */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-2">
            Ops Budget Allocation
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Current fiscal quarter utilization.
          </p>
          <div className="flex items-center justify-around">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={budgetData}
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {budgetData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600" />
                <span className="text-sm font-medium text-slate-600">
                  Utilized: 72%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-sm font-medium text-slate-600">
                  Buffer: 28%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CooAnalytics;
