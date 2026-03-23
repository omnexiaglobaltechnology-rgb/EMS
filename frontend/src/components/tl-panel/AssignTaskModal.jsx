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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0f172a]/90 backdrop-blur-2xl p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">Assign New Task</h2>
          <p className="text-xs text-slate-400 font-medium">Coordinate work by assigning tasks to {roleLabel.toLowerCase()}s</p>
        </div>

        <div className="space-y-4">
          {/* Assignee selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Select {roleLabel}</label>
            <select
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              disabled={loadingUsers}
            >
              <option value="" className="bg-[#0f172a]">
                {loadingUsers ? "Loading user records…" : `Choose an ${roleLabel.toLowerCase()}`}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0f172a]">
                  {u.name} — {u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Task Name</label>
            <input
              placeholder="What needs to be done?"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              value={form.task}
              onChange={(e) => setForm({ ...form, task: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Description (Optional)</label>
            <textarea
              placeholder="Add more details about this assignment..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[100px] resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Priority</label>
              <select
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low" className="bg-[#0f172a]">Low Priority</option>
                <option value="medium" className="bg-[#0f172a]">Medium Priority</option>
                <option value="high" className="bg-[#0f172a]">High Priority</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Initial Status</label>
              <select
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="pending" className="bg-[#0f172a]">Not Started</option>
                <option value="in_progress" className="bg-[#0f172a]">In Progress</option>
                <option value="completed" className="bg-[#0f172a]">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Deadline Date</label>
            <input
              type="date"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer [color-scheme:dark]"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/5 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loadingUsers}
            className="px-8 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            {loadingUsers ? "Syncing..." : "Assign Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTaskModal;
