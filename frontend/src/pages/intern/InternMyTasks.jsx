import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import TaskCard from "../../components/intern/TaskCard";
import { tasksApi } from "../../utils/api";

const TABS = [
  { key: "all", label: "All Tasks" },
  { key: "pending", label: "Pending" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

/**
 * Task management interface for interns.
 * Filters and displays tasks assigned to the current intern based on status.
 */
const InternMyTasks = () => {
  // Get the real logged-in user's ID from Redux auth state
  const { id: currentUserId } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tasks assigned to this intern
  useEffect(() => {
    if (currentUserId) fetchTasks();
  }, [currentUserId]);

  /**
   * Retrieves all tasks and localizes the set to those assigned to this intern.
   * Maps API status strings to dashboard-friendly keys.
   */
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await tasksApi.getAll();

      // Filter tasks assigned to this logged-in intern using their real MongoDB ID
      const internTasks = allTasks.filter(
        (task) => task.assignedToId === currentUserId,
      );

      // Map API response to component format
      const mappedTasks = internTasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status:
          task.status === "pending"
            ? "pending"
            : task.status === "in_progress"
              ? "in-progress"
              : task.status === "completed"
                ? "completed"
                : task.status,
        priority:
          task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
        due: new Date(task.dueDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        overdue: new Date(task.dueDate) < new Date(),
      }));

      setTasks(mappedTasks);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks =
    activeTab === "all" ? tasks : tasks.filter((t) => t.status === activeTab);

  // Calculate counts
  const tabsWithCounts = TABS.map((tab) => ({
    ...tab,
    count:
      tab.key === "all"
        ? tasks.length
        : tasks.filter((t) => t.status === tab.key).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-600">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-2">
        {tabsWithCounts.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
              ${activeTab === tab.key
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold capitalize text-slate-900 mb-6">
          {activeTab === "all"
            ? "All Tasks"
            : `${activeTab.replace("-", " ")} Tasks`}
        </h2>

        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <p className="text-center text-slate-500 py-8">
              No {activeTab === "all" ? "tasks" : activeTab} tasks yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternMyTasks;
