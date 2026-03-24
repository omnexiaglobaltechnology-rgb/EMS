import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Plus } from "lucide-react";

import AssignTaskModal from "../../components/tl-panel/AssignTaskModal";
import PriorityBadge from "../../components/tl-panel/PriorityBadge";
import StatusBadge from "../../components/tl-panel/StatusBadge";
import { tasksApi, submissionsApi } from "../../utils/api";

/**
 * Task management interface for TL Interns to assign and track intern tasks.
 * Fetches real tasks from the backend and allows creating tasks via API.
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
   * Fetches all tasks from the API.
   */
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getAll();
      
      // Sync status with submissions (make enrichment totally silent to avoid permission alerts)
      const synchronizedTasks = await Promise.all(
        data.map(async (task) => {
          try {
            const taskId = task.id || task._id;
            if (!taskId) return task;
            
            const subs = await submissionsApi.getByTask(taskId);
            
            if (Array.isArray(subs) && subs.length > 0) {
              const latestSub = subs[subs.length - 1];
              const isApproved = subs.some(s => s.status === "approved" || s.status === "completed");
              
              if (isApproved) return { ...task, status: "completed" };
              if (latestSub.status === "pending" || latestSub.status === "submitted") return { ...task, status: "submitted" };
              if (latestSub.status === "under_review" || latestSub.status === "reviewed") return { ...task, status: "under_review" };
              if (latestSub.status === "rejected") return { ...task, status: "rejected" };
            }
          } catch (e) {
            // Silence permission errors during background sync enrichment
            console.debug(`Sync suppressed for task ${task.id}:`, e.message);
          }
          return task;
        })
      );

      setTasks(synchronizedTasks);
      setError(null);
    } catch (err) {
      // Only show error if the primary fetch failed and we have no data
      // Filter out permission strings to avoid confusing the user for non-breaking sync errors
      if (err.message !== "Insufficient permissions") {
        setError(err.message);
      }
      console.error("Task fetch lifecycle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Creates a new task via API and refreshes the task list.
   *
   * @param {object} newTask - Task details from AssignTaskModal
   */
  const addTask = async (newTask) => {
    try {
      const taskData = {
        title: newTask.task,
        description: newTask.description || newTask.task,
        departmentId: newTask.intern.departmentId || "",
        assignedToId: newTask.intern.id,   // Real MongoDB user ID from the modal
        assignedById: currentUserId,
        priority: newTask.priority.toLowerCase(),
        dueDate: new Date(newTask.deadline).toISOString(),
        status: newTask.status || "pending",
      };

      await tasksApi.create(taskData);
      // Refresh the full list so the new task appears with proper data
      await fetchTasks();
      setOpen(false);
      setError(null);
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
      <div className="flex items-center justify-between bg-white/5 p-6 rounded-[24px] border border-white/10 backdrop-blur-xl">
        <h1 className="text-xl font-bold text-white tracking-tight">Intern Tasks</h1>

        <button
          onClick={() => setOpen(true)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <Plus size={18} />
          Assign New Task
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
          <p className="text-slate-500 font-medium">No tasks have been assigned yet.</p>
        </div>
      ) : (
        <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned To</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Task Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Priority</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Deadline</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tasks.map((t) => (
                  <tr key={t.id || t._id} className="group hover:bg-white/5 transition-all duration-300">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs shadow-inner">
                          {(t.assignedTo?.name || (typeof t.assignedToId === 'object' ? t.assignedToId?.name : t.assignedToId) || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {t.assignedTo?.name || 
                             (typeof t.assignedToId === 'object' ? t.assignedToId?.name : t.assignedToId) || 
                             "Unknown"}
                          </div>
                          {(t.assignedTo?.email || (typeof t.assignedToId === 'object' && t.assignedToId?.email)) && (
                            <div className="text-[10px] font-medium text-slate-500 tracking-wide mt-0.5">
                              {t.assignedTo?.email || t.assignedToId?.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-slate-200">
                        {t.title}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <PriorityBadge
                        value={
                          t.priority
                            ? t.priority.charAt(0).toUpperCase() +
                            t.priority.slice(1)
                            : "Medium"
                        }
                      />
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                        {t.dueDate
                          ? new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : "No Deadline"}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <StatusBadge
                        value={
                          ["pending", "assigned", "delegated"].includes(t.status)
                            ? "Not Started"
                            : t.status === "in_progress"
                              ? "In Progress"
                              : ["submitted"].includes(t.status)
                                ? "Submitted"
                                : ["under_review", "reviewed"].includes(t.status)
                                  ? "Under Review"
                                  : t.status === "rejected"
                                    ? "Rejected"
                                    : "Completed"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-t border-white/10 text-slate-500">
             <span className="text-[10px] font-bold uppercase tracking-widest">
               Records Sync: Live
             </span>
             <span className="text-[10px] font-bold uppercase tracking-widest">
               Showing {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
             </span>
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
