import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Plus } from "lucide-react";

import AssignTaskModal from "../../components/tl-panel/AssignTaskModal";
import PriorityBadge from "../../components/tl-panel/PriorityBadge";
import StatusBadge from "../../components/tl-panel/StatusBadge";
import { tasksApi } from "../../utils/api";

/**
 * Task assignment and tracking interface for Team Leads.
 * Fetches real tasks from the backend and allows assigning to real interns.
 */
const TlInternTask = () => {
  const { id: currentUserId } = useSelector((state) => state.auth);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  /**
   * Fetches all tasks from the API and displays them in the table.
   */
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getAll();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Creates a new task via API and refreshes the list.
   *
   * @param {object} newTask - Task details from AssignTaskModal
   */
  const addTask = async (newTask) => {
    try {
      const taskData = {
        title: newTask.task,
        description: newTask.description || newTask.task,
        departmentId: newTask.intern.departmentId || "", // will be handled by backend if empty
        assignedToId: newTask.intern.id,   // Real MongoDB user ID from the modal
        assignedById: currentUserId,
        priority: newTask.priority.toLowerCase(),
        dueDate: new Date(newTask.deadline).toISOString(),
        status: newTask.status || "pending",
      };

      await tasksApi.create(taskData);
      // Refresh the full list to get populated data
      await fetchTasks();
      setOpen(false);
    } catch (err) {
      setError(err.message);
      console.error("Failed to create task:", err);
      alert(`Error creating task: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>

        <button
          onClick={() => setOpen(true)}
          disabled={loading}
          className="cursor-pointer flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus size={16} />
          Assign New Task
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No tasks assigned yet</div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-left">Task Name</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Deadline</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {tasks.map((t) => (
                <tr key={t.id || t._id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {t.assignedTo?.name || t.assignedToId || "Unknown"}
                    </div>
                    {t.assignedTo?.email && (
                      <div className="text-xs text-slate-400">{t.assignedTo.email}</div>
                    )}
                  </td>

                  <td className="px-4 py-3">{t.title}</td>

                  <td className="px-4 py-3">
                    <PriorityBadge
                      value={
                        t.priority
                          ? t.priority.charAt(0).toUpperCase() +
                          t.priority.slice(1)
                          : "Medium"
                      }
                    />
                  </td>

                  <td className="px-4 py-3">
                    {t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      value={
                        t.status === "pending"
                          ? "Not Started"
                          : t.status === "in_progress"
                            ? "In Progress"
                            : "Completed"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-500">
            Showing 1–{tasks.length} of {tasks.length} tasks
          </div>
        </div>
      )}

      {open && (
        <AssignTaskModal
          onClose={() => setOpen(false)}
          onSubmit={addTask}
          targetRole="intern"
        />
      )}
    </div>
  );
};

export default TlInternTask;
