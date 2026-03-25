import { useEffect, useState } from "react";
import {
  Users,
  BarChart3,
  TrendingUp,
  FileText,
  AlertCircle,
  Loader,
} from "lucide-react";

import TeamProgressRow from "../../components/manager/TeamProgressRow";
import RecentReportItem from "../../components/manager/RecentReportItem";
import StatCard from "../../components/manager/StatCard";
import { tasksApi, submissionsApi } from "../../utils/api";

/**
 * Main command center for managers.
 * Displays real-time KPIs, active project status, and recent reporting activity.
 */
const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeProjects: 0,
    kpi: 0,
    reportsGenerated: 0,
  });
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Orchestrates data fetching for the dashboard.
   * Combines task metrics with submission counts for a comprehensive status overview.
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all tasks
      const allTasks = await tasksApi.getAll();

      // Calculate employee count (unique assignees)
      const uniqueEmployees = new Set(
        allTasks.map((task) => task.assignedToId).filter(Boolean),
      ).size;

      // Calculate active projects (tasks not completed)
      const activeProjects = allTasks.filter(
        (task) => task.status !== "completed",
      ).length;

      // Calculate KPI (completion rate)
      const completedTasks = allTasks.filter(
        (task) => task.status === "completed",
      ).length;
      const kpi =
        allTasks.length > 0
          ? Math.round((completedTasks / allTasks.length) * 100)
          : 0;

      // Fetch submissions for reports count
      let submissionCount = 0;
      try {
        const allSubmissions = [];
        for (const task of allTasks) {
          try {
            const taskId = task.id || task._id;
            if (!taskId) {
              console.warn("Task missing ID, skipping submission fetch:", task);
              continue;
            }
            const taskSubmissions = await submissionsApi.getByTask(taskId);
            allSubmissions.push(...taskSubmissions);
          } catch (innerErr) {
            console.warn(`Could not fetch submissions for task ${task.id || task._id}:`, innerErr);
            // Continue to the next task even if one fails
          }
        }
        submissionCount = allSubmissions.length;
      } catch (err) {
        console.warn("Could not fetch submissions:", err);
      }

      setStats({
        totalEmployees: uniqueEmployees,
        activeProjects,
        kpi,
        reportsGenerated: submissionCount,
      });

      // Generate team performance data (by department/category)
      const departments = calculateTeamPerformance(allTasks);
      setTeamPerformance(departments);

      // Generate recent reports
      const reports = generateRecentReports(allTasks);
      setRecentReports(reports);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Segments task completion rates by priority levels.
   *
   * @param {Array} tasks - Raw task data from API
   * @returns {Array} Formatted performance metrics for visualization
   */
  const calculateTeamPerformance = (tasks) => {
    // Group tasks by priority/status to show performance
    const priorities = ["high", "medium", "low"];
    const performance = priorities.map((priority) => {
      const priorityTasks = tasks.filter(
        (task) => (task.priority || "medium").toLowerCase() === priority,
      );
      const completedInPriority = priorityTasks.filter(
        (task) => task.status === "completed",
      ).length;
      const percentComplete =
        priorityTasks.length > 0
          ? Math.round((completedInPriority / priorityTasks.length) * 100)
          : 0;

      return {
        label: priority.charAt(0).toUpperCase() + priority.slice(1),
        value: percentComplete,
      };
    });

    return performance.length > 0
      ? performance
      : [];
  };

  /**
   * Transforms internal task updates into human-readable activity reports.
   *
   * @param {Array} tasks - List of updated tasks
   * @returns {Array} Simplified report items with time-ago formatting
   */
  const generateRecentReports = (tasks) => {
    // Sort tasks by updated date to show recent activity as reports
    const recentTasks = tasks
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt),
      )
      .slice(0, 3);

    return recentTasks.map((task, index) => {
      const daysAgo = Math.floor(
        (Date.now() - new Date(task.updatedAt || task.createdAt)) /
          (1000 * 60 * 60 * 24),
      );
      const timeText =
        daysAgo === 0 ? "today" : `${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`;

      return {
        title: `${task.title} - ${task.status.replace("_", " ")}`,
        time: timeText,
      };
    });
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

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-tight">
          Welcome back, <span className="text-[#00d4ff] blue-glow">Manager!</span>
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-0.5 w-10 bg-[#00d4ff] rounded-full shadow-[0_0_10px_rgba(0,212,255,0.5)]"></div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
            Department overview and analytics
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={String(stats.totalEmployees)}
          icon={Users}
        />
        <StatCard
          title="Active Projects"
          value={String(stats.activeProjects)}
          icon={BarChart3}
        />
        <StatCard
          title="Department KPI"
          value={`${stats.kpi}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Reports Generated"
          value={String(stats.reportsGenerated)}
          icon={FileText}
        />
      </div>

      {/* LOWER SECTION */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* TEAM PERFORMANCE */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff]/5 blur-[60px] rounded-full pointer-events-none"></div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#00d4ff] blue-glow"></span>
            Team Performance
          </h2>

          {teamPerformance.length > 0 ? (
            teamPerformance.map((team, idx) => (
              <TeamProgressRow
                key={idx}
                label={team.label}
                value={team.value}
              />
            ))
          ) : (
            <p className="text-gray-500">No team data available</p>
          )}
        </div>

        {/* RECENT REPORTS */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none"></div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
            Recent Reports
          </h2>

          {recentReports.length > 0 ? (
            recentReports.map((report, idx) => (
              <RecentReportItem
                key={idx}
                title={report.title}
                time={report.time}
              />
            ))
          ) : (
            <p className="text-gray-500">No recent reports available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
