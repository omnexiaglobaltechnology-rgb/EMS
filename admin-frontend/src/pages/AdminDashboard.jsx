import { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  Activity,
  Settings,
  AlertCircle,
  Loader,
} from "lucide-react";
import { tasksApi, submissionsApi } from "../utils/api";

/**
 * Main dashboard component for the Admin panel.
 * Displays high-level system statistics, recent activity, and system health status.
 * Fetches and processes data from tasks and submissions to generate these insights.
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState([
    {
      title: "Total Users",
      value: 0,
      change: "+12% from last week",
      icon: Users,
    },
    { title: "Active Roles", value: 8, icon: ShieldCheck },
    { title: "System Health", value: "98%", icon: Activity },
    { title: "Configurations", value: 24, icon: Settings },
  ]);

  const [recentActivity, setRecentActivity] = useState([]);
  const [systemStatus, setSystemStatus] = useState([
    { label: "Database", status: "Healthy" },
    { label: "Authentication", status: "Healthy" },
    { label: "Storage", status: "Healthy" },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define active roles in system
  const ACTIVE_ROLES = [
    "Admin",
    "Manager",
    "Team Lead",
    "Intern",
    "CEO",
    "CFO",
    "CTO",
    "COO",
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Fetches tasks and submissions, processes them, and updates dashboard metrics.
   * Calculates unique users, active roles, and recent activity timeline.
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all tasks and submissions
      const allTasks = await tasksApi.getAll();
      let allSubmissions = [];

      for (const task of allTasks) {
        try {
          const taskSubmissions = await submissionsApi.getByTask(task.id);
          allSubmissions.push(...taskSubmissions);
        } catch (err) {
          console.warn(`Could not fetch submissions for task ${task.id}:`, err);
        }
      }

      // Calculate unique users (creators, assignees, submitters)
      const uniqueUsers = new Set();
      allTasks.forEach((task) => {
        if (task.createdById) uniqueUsers.add(task.createdById);
        if (task.assignedToId) uniqueUsers.add(task.assignedToId);
      });
      allSubmissions.forEach((sub) => {
        if (sub.submittedById) uniqueUsers.add(sub.submittedById);
      });

      // Update stats with real data
      const updatedStats = [
        {
          title: "Total Users",
          value: Math.max(uniqueUsers.size, 1),
          change: "+12% from last week",
          icon: Users,
        },
        {
          title: "Active Roles",
          value: ACTIVE_ROLES.length,
          icon: ShieldCheck,
        },
        {
          title: "System Health",
          value: "98%",
          icon: Activity,
        },
        {
          title: "Configurations",
          value: 24,
          icon: Settings,
        },
      ];
      setStats(updatedStats);

      // Generate recent activity from tasks and submissions
      const activities = generateRecentActivity(allTasks, allSubmissions);
      setRecentActivity(activities);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generates a combined list of recent activity from sorted tasks and submissions.
   *
   * @param {Array} tasks - List of all tasks
   * @param {Array} submissions - List of all submissions
   * @returns {Array} Formatted activity objects containing text and time strings
   */
  const generateRecentActivity = (tasks, submissions) => {
    const activities = [];

    // Add recent task activities
    tasks
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt),
      )
      .slice(0, 2)
      .forEach((task) => {
        const timeAgo = getTimeAgo(new Date(task.updatedAt || task.createdAt));
        activities.push({
          text: `Task "${task.title}" updated to ${task.status.replace("_", " ")}`,
          time: timeAgo,
        });
      });

    // Add recent submission activities
    submissions
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt),
      )
      .slice(0, 1)
      .forEach((submission) => {
        const timeAgo = getTimeAgo(
          new Date(submission.updatedAt || submission.createdAt),
        );
        activities.push({
          text: `Submission received - ${submission.status}`,
          time: timeAgo,
        });
      });

    return activities.length > 0
      ? activities
      : [{ text: "No recent activity", time: "N/A" }];
  };

  /**
   * Helper to format a Date into a relative "time ago" string.
   *
   * @param {Date} date - The date to compare against the current time
   * @returns {string} Relative time string (e.g., "5m ago", "2d ago")
   */
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;

    if (interval > 1) {
      return Math.floor(interval) + "y ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + "m ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + "d ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + "h ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + "m ago";
    }
    return Math.floor(seconds) + "s ago";
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-slate-500">System overview and management.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-gray-300 bg-white p-6 flex justify-between items-start"
          >
            <div>
              <p className="text-sm text-slate-500">{item.title}</p>
              <h2 className="text-3xl font-bold mt-1">{item.value}</h2>
              {item.change && (
                <p className="text-green-600 text-sm mt-1">{item.change}</p>
              )}
            </div>

            <div className="rounded-lg bg-indigo-600 p-3 text-white">
              <item.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent User Activity */}
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Recent User Activity</h2>

          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((a, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center rounded-lg bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm">{a.text}</span>
                  <span className="text-xs text-slate-500">{a.time}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>

          <div className="space-y-4">
            {systemStatus.map((s) => (
              <div
                key={s.label}
                className="flex justify-between items-center rounded-lg bg-slate-50 px-4 py-3"
              >
                <span className="font-medium">{s.label}</span>

                <span className="flex items-center gap-2 text-green-600 text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
