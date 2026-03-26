import { useEffect, useState } from "react";
import {
  Users,
  ClipboardCheck,
  FileClock,
  Calendar,
  CheckSquare,
  FileText,
  AlertCircle,
  Loader,
} from "lucide-react";

import ActivityRow from "../../components/tl-panel/ActivityRow";
import StatCard from "../../components/tl-panel/StatCard";
import { tasksApi, submissionsApi } from "../../utils/api";

/**
 * Main dashboard for Team Leads.
 * Aggregates statistics for managed interns, active tasks, and pending submission reviews.
 */
const TlDashboard = () => {
  const [stats, setStats] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Orchestrates data fetching for the dashboard stats and activity feed.
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all tasks to calculate statistics
      const allTasks = await tasksApi.getAll();

      // Calculate task statistics
      const activeTasks = allTasks.filter(
        (task) => task.status === "in_progress" || task.status === "pending",
      ).length;

      const inProgressCount = allTasks.filter(
        (task) => task.status === "in_progress",
      ).length;

      const completedCount = allTasks.filter(
        (task) => task.status === "completed",
      ).length;

      // Get unique interns assigned to tasks
      const uniqueInterns = new Set(
        allTasks.map((task) => task.assignedToId).filter(Boolean),
      ).size;

      // Fetch all submissions to count pending reviews
      let pendingSubmissions = 0;
      try {
        // Get all submissions and filter for pending status
        const submissionsData = [];
        const tasksWithIds = allTasks.filter((task) =>
          Boolean(task.id || task._id),
        );
        for (const task of tasksWithIds) {
          const taskId = task.id || task._id;
          const taskSubmissions = await submissionsApi.getByTask(taskId);
          submissionsData.push(...taskSubmissions);
        }
        pendingSubmissions = submissionsData.filter(
          (sub) => sub.status === "pending",
        ).length;
      } catch (err) {
        console.warn("Could not fetch submissions:", err);
      }

      // Create stats array
      const statsData = [
        {
          title: "Total Interns",
          value: uniqueInterns,
          subtitle: "Currently managing",
          icon: Users,
        },
        {
          title: "Active Tasks",
          value: activeTasks,
          subtitle: "Tasks in progress",
          icon: ClipboardCheck,
        },
        {
          title: "Pending Reviews",
          value: String(pendingSubmissions).padStart(2, "0"),
          subtitle: "Awaiting your review",
          icon: FileClock,
        },
        {
          title: "Completed",
          value: completedCount,
          subtitle: "Tasks finished",
          icon: Calendar,
        },
      ];

      setStats(statsData);

      // Generate activities from recent tasks and submissions
      const recentActivities = generateActivities(allTasks);
      setActivities(recentActivities);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Transforms raw task and submission data into a human-readable activity timeline.
   *
   * @param {Array} tasks - List of recent tasks
   * @returns {Array} Formatted activity items
   */
  const generateActivities = (tasks) => {
    // Generate activities from task updates (sorted by updated date)
    const activities = tasks
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt),
      )
      .slice(0, 5)
      .map((task, index) => ({
        id: task.id || task._id || `activity-${index}`,
        time: new Date(task.updatedAt || task.createdAt).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          },
        ),
        text: `Task "${task.title}" status: ${task.status.replace("_", " ")}`,
        icon: CheckSquare,
      }));

    return activities.length > 0
      ? activities
      : [
          {
            id: 0,
            time: "N/A",
            text: "No recent activity",
            icon: FileText,
          },
        ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-slate-400" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Team Lead Dashboard
        </h1>
        <p className="mt-1 text-slate-500">
          Overview of interns, tasks, and reviews
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-medium text-slate-900">Recent Activity</h2>
        </div>

        <div className="divide-y">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))
          ) : (
            <div className="p-5 text-center text-slate-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TlDashboard;
