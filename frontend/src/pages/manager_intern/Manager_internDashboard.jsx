import { Users, BarChart3, TrendingUp, FileText } from "lucide-react";

import TeamProgressRow from "../../components/manager/TeamProgressRow";
import RecentReportItem from "../../components/manager/RecentReportItem";
import StatCard from "../../components/manager/StatCard";

/**
 * Operational dashboard for manager-interns.
 * Provides a summarized overview of intern performance and report generation status.
 */
const Manager_internDashboard = () => {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, Manager-Intern!
        </h1>
        <p className="text-slate-500 mt-1">
          Department overview and analytics.
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Interns" value="45" icon={Users} />
        <StatCard
          title="Active Projects"
          value="12"
          trend="+8% from last week"
          icon={BarChart3}
        />
        <StatCard
          title="Department KPI"
          value="94%"
          trend="+3% from last week"
          icon={TrendingUp}
        />
        <StatCard title="Reports Generated" value="28" icon={FileText} />
      </div>

      {/* LOWER SECTION */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* TEAM PERFORMANCE */}
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <h2 className="text-lg font-semibold mb-6">Team Performance</h2>

          <TeamProgressRow label="Engineering" value={90} />
          <TeamProgressRow label="Design" value={85} />
          <TeamProgressRow label="QA" value={80} />
          <TeamProgressRow label="DevOps" value={75} />
        </div>

        {/* RECENT REPORTS */}
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <h2 className="text-lg font-semibold mb-6">Recent Reports</h2>

          <RecentReportItem
            title="Weekly Performance Report"
            time="1 day ago"
          />
          <RecentReportItem title="Budget Analysis" time="2 days ago" />
          <RecentReportItem title="Resource Allocation" time="3 days ago" />
        </div>
      </div>
    </div>
  );
};

export default Manager_internDashboard;
