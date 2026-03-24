import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import TaskCard from "../../components/intern/TaskCard";
import { tasksApi, submissionsApi } from "../../utils/api";
import { CheckSquare, Loader2, AlertCircle, Search, Filter, RefreshCw } from "lucide-react";

const TABS = [
  { key: "all", label: "All Tasks" },
  { key: "assigned", label: "In Progress" },
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

      // Find all tasks that:
      // A) are currently assigned to this intern
      // B) have at least one submission from this intern (historical)
      const tasksWithSync = await Promise.all(allTasks.map(async (task) => {
        const taskId = task.id || task._id;
        const isAssigned = String(task.assignedToId?._id || task.assignedToId?.id || task.assignedToId) === String(currentUserId);
        
        let hasSubmissions = false;
        let isApproved = false;

        try {
          const subs = await submissionsApi.getByTask(taskId);
          if (Array.isArray(subs)) {
             const mySubs = subs.filter(s => String(s.submittedById?._id || s.submittedById?.id || s.submittedById) === String(currentUserId));
             hasSubmissions = mySubs.length > 0;
             isApproved = mySubs.some(s => s.status === 'approved');
          }
        } catch (e) {
          console.warn(`Sync check failed for task ${taskId}`, e);
        }

        if (!isAssigned && !hasSubmissions) return null;

        return {
          id: taskId,
          title: task.title,
          description: task.description,
          status: isApproved ? 'approved' : task.status,
          priority: task.priority || 'medium',
          due: new Date(task.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          overdue: new Date(task.dueDate) < new Date() && !['completed', 'approved'].includes(isApproved ? 'approved' : task.status),
          updatedAt: task.updatedAt
        };
      }));

      const finalTasks = tasksWithSync.filter(t => t !== null);

      setTasks(finalTasks);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await tasksApi.update(taskId, { status: newStatus });
      // Update local state without waiting for full refetch
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err.message || "Failed to update task status. Please try again.");
    }
  };

  const filteredTasks =
    activeTab === "all" 
      ? tasks 
      : activeTab === "assigned"
        ? tasks.filter((t) => ["assigned", "delegated", "rejected", "in_progress"].includes(t.status))
        : activeTab === "submitted"
          ? tasks.filter((t) => ["submitted", "under_review"].includes(t.status))
          : activeTab === "completed"
            ? tasks.filter((t) => ["completed", "approved"].includes(t.status))
            : tasks.filter((t) => t.status === activeTab);

  // Calculate counts for tabs
  const tabsWithCounts = TABS.map((tab) => {
    let count = 0;
    if (tab.key === "all") count = tasks.length;
    else if (tab.key === "assigned") count = tasks.filter((t) => ["assigned", "delegated", "rejected", "in_progress"].includes(t.status)).length;
    else if (tab.key === "submitted") count = tasks.filter((t) => ["submitted", "under_review"].includes(t.status)).length;
    else if (tab.key === "completed") count = tasks.filter((t) => ["completed", "approved"].includes(t.status)).length;
    else count = tasks.filter((t) => t.status === tab.key).length;
    
    return { ...tab, count };
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center -m-4 md:-m-6 bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Fetching your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 min-h-screen bg-[#0f172a] text-white p-6 md:p-8 -m-4 md:-m-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-inner">
               <CheckSquare size={20} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Task Management</span>
           </div>
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            My Tasks
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            Manage and track your assigned goals.
          </p>
        </div>

        {/* Right Side: Sync & Tabs */}
        <div className="flex flex-col md:flex-row items-center gap-4">
           {/* Manual Sync Button */}
           <button 
             onClick={fetchTasks}
             className="p-3 rounded-2xl bg-white/5 border border-white/10 text-indigo-400 hover:bg-white/10 transition-all active:scale-90 group"
             title="Sync with Submissions"
           >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
           </button>

           {/* Tabs - Glass Effect */}
           <div className="flex flex-wrap gap-2 rounded-2xl bg-white/5 border border-white/10 p-2 backdrop-blur-xl shadow-2xl">
             {tabsWithCounts.map((tab) => (
               <button
                 key={tab.key}
                 onClick={() => setActiveTab(tab.key)}
                 className={`flex cursor-pointer items-center gap-3 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300
                   ${activeTab === tab.key
                     ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105"
                     : "text-slate-400 hover:text-white hover:bg-white/5"
                   }`}
               >
                 {tab.label}
                 {tab.count > 0 && (
                   <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black shadow-inner
                     ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-white/10 text-slate-500"}`}>
                     {tab.count}
                   </span>
                 )}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 font-bold flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
               <AlertCircle size={24} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 mb-1">Connectivity Alert</p>
               <p className="text-sm font-black text-white/90 leading-tight">{error}</p>
             </div>
          </div>
          <button 
             onClick={fetchTasks}
             className="px-8 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-[#0f172a] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center gap-2"
          >
             <RefreshCw size={14} />
             Retry Connectivity
          </button>
        </div>
      )}

      {/* Main Section - Glass Container */}
      <div className="rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 md:p-10 shadow-3xl relative overflow-hidden group">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black text-white flex items-center gap-4">
             <span className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                <Search size={22} />
             </span>
             {activeTab === "all"
                ? "All Assigned Tasks"
                : `${TABS.find(t => t.key === activeTab)?.label || activeTab} Goals`}
          </h2>
          <div className="flex items-center gap-3 text-slate-500">
             <Filter size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest">{filteredTasks.length} Result{filteredTasks.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard 
                 key={task.id} 
                 task={task} 
                 onStatusUpdate={handleStatusUpdate}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="p-6 rounded-[30px] bg-white/5 border border-white/5 mb-6 opacity-20">
                 <CheckSquare size={48} className="text-slate-400" />
               </div>
               <p className="text-slate-400 text-lg font-bold">No {activeTab === "all" ? "" : activeTab} tasks found</p>
               <p className="text-slate-600 text-sm mt-2 font-medium">Sit back and relax or check back later for updates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternMyTasks;
