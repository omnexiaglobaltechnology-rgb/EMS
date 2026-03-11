import { useState, useEffect } from "react";
import { usersApi } from "../../utils/api";

/**
 * Modal used by team leads / managers to assign new tasks to users.
 * Dynamically fetches real users from the backend by role.
 *
 * @param {function} onClose      - Close the modal
 * @param {function} onSubmit     - Callback with validated task data
 * @param {string}   targetRole   - Role to fetch for the assignee list (default: "intern")
 */
const AssignTaskModal = ({ onClose, onSubmit, targetRole = "intern" }) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [form, setForm] = useState({
    assigneeId: "",
    task: "",
    description: "",
    priority: "medium",
    deadline: "",
    status: "pending",
  });

  // Fetch real users from the backend on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const data = await usersApi.getByRole(targetRole);
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        alert("Could not load user list. Please try again.");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [targetRole]);

  /**
   * Validates required inputs and submits the newly assigned task.
   */
  const handleSubmit = () => {
    const assignee = users.find((u) => u.id === form.assigneeId);
    if (!assignee || !form.task || !form.deadline) {
      alert("Please fill in all required fields");
      return;
    }

    onSubmit({
      intern: assignee,   // Keep "intern" key for backward compat with addTask()
      task: form.task,
      description: form.description || form.task,
      priority: form.priority,
      deadline: form.deadline,
      status: form.status,
    });

    setForm({
      assigneeId: "",
      task: "",
      description: "",
      priority: "medium",
      deadline: "",
      status: "pending",
    });
  };

  const roleLabel = targetRole === "intern" ? "Intern" : "Team Lead";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Assign New Task</h2>

        {/* Assignee selector */}
        <select
          className="w-full rounded border px-3 py-2"
          value={form.assigneeId}
          onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
          disabled={loadingUsers}
        >
          <option value="">
            {loadingUsers ? "Loading…" : `Select ${roleLabel}`}
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>

        <input
          placeholder="Task name *"
          className="w-full rounded border px-3 py-2"
          value={form.task}
          onChange={(e) => setForm({ ...form, task: e.target.value })}
        />

        <input
          placeholder="Description (optional)"
          className="w-full rounded border px-3 py-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <select
            className="rounded border px-3 py-2"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            className="rounded border px-3 py-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="pending">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <input
          type="date"
          className="w-full rounded border px-3 py-2"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="rounded border px-4 py-2 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loadingUsers}
            className="rounded bg-indigo-600 px-4 py-2 text-white cursor-pointer disabled:opacity-50"
          >
            Assign Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTaskModal;
