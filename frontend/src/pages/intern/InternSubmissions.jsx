import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";

import { Plus, FileText, Loader2, AlertCircle, Search, RefreshCw } from "lucide-react";

import NewSubmissionModal from "../../components/intern/NewSubmissionModal";

import SummaryCard from "../../components/intern/SummaryCard";
import SubmissionRow from "../../components/intern/SubmissionRow";
import { submissionsApi, tasksApi } from "../../utils/api";

/**
 * Submission tracking and management portal for interns.
 * Enables interns to upload files or links for review against assigned tasks.
 */
const InternSubmissions = () => {
  const { id: internId } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch submissions and tasks on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Fetches tasks and their associated submissions to populate the history table.
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all system tasks (authenticated interns have task.read permission)
      const allTasks = await tasksApi.getAll();

      // Filter tasks where the user is actually the assignee
      const myTasks = allTasks.filter((task) => {
        const targetId = task.assignedToId?._id || task.assignedToId?.id || task.assignedToId;
        return String(targetId) === String(internId);
      });

      // Split into tasks for the "New Submission" modal (Active/Needs work)
      const activeTasks = myTasks
        .filter((task) => ["assigned", "pending", "delegated", "rejected", "in_progress"].includes(task.status))
        .map(t => ({
          ...t,
          displayStatus: t.status === "rejected" ? "Needs Revision" : "In Progress"
        }));
      setTasks(activeTasks);

      // 2. Fetch submissions ONLY for these specific tasks to avoid 403s on unauthorized tasks
      let allSubmissions = [];
      
      // Use Promise.all with individual error handling for better parallelism and resilience
      await Promise.all(myTasks.map(async (task) => {
        try {
          const taskId = task.id || task._id;
          if (!taskId) return;
          
          const taskSubmissions = await submissionsApi.getByTask(taskId);
          
          if (Array.isArray(taskSubmissions)) {
            const mapped = taskSubmissions
              .filter((sub) => {
                const subId = sub.submittedById?._id || sub.submittedById?.id || sub.submittedById;
                return String(subId) === String(internId);
              })
              .map((sub) => ({
                id: sub._id || sub.id,
                task: task.title,
                taskId: task._id || task.id,
                type: sub.fileUrl ? "file" : sub.externalLink ? "link" : "comment",
                submittedOn: new Date(sub.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                }),
                status: sub.status === "pending" || sub.status === "submitted" ? "pending" : sub.status === "approved" || sub.status === "completed" ? "approved" : "rejected",
                reviewer: (sub.reviewedById?.name || sub.reviewedBy?.name || "-"),
                fileUrl: sub.fileUrl,
                externalLink: sub.externalLink,
                comment: sub.comment,
                feedback: sub.reviewComment || sub.reviewNote || "",
                createdAt: sub.createdAt,
              }));
            allSubmissions = [...allSubmissions, ...mapped];
          }
        } catch (_e) {
          console.warn(`[Submissions] Partial sync failure for task ${task.id}:`, _e.message);
        }
      }));

      // Sort history by newest first
      setSubmissions(allSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError(err.message === "Insufficient permissions" 
        ? "Access restricted: You only have permission to view your own assigned work records."
        : err.message);
      console.error("Critical error in Submissions Portal:", err);
    } finally {
      setLoading(false);
    }
  }, [internId]);

  const total = submissions.length;
  const approved = submissions.filter((s) => s.status === "approved").length;
  const pending = submissions.filter((s) => s.status === "pending").length;

  // Handler to add a new submission
  /**
   * Handles the creation of a new task submission using multipart form data.
   *
   * @param {object} submissionData - Data containing taskId, comment, and file/link
   */
  const handleNewSubmission = async (submissionData) => {
    try {
      if (!submissionData.taskId) {
        setError("Please select a task");
        return;
      }

      const formData = new FormData();
      formData.append("taskId", submissionData.taskId);
      formData.append("submittedById", internId);
      formData.append("comment", submissionData.comment || "");

      if (submissionData.externalLink) {
        formData.append("externalLink", submissionData.externalLink);
      }

      if (submissionData.file) {
        formData.append("file", submissionData.file);
      }

      const created = await submissionsApi.create(formData);
      
      // The backend often returns _id instead of id depending on population
      const createdId = created?._id || created?.id;
      
      if (!createdId) {
        setError("Failed to verify submission creation with the server.");
        return;
      }

      const task = tasks.find((t) => String(t._id || t.id) === String(created.taskId?._id || created.taskId?.id || created.taskId));

      setSubmissions((prev) => [
        {
          id: createdId,
          task: task?.title || "Unknown",
          taskId: created.taskId?._id || created.taskId?.id || created.taskId,
          type: created.fileUrl
            ? "file"
            : created.externalLink
              ? "link"
              : "comment",
          submittedOn: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status: "pending",
          reviewer: "-",
          fileUrl: created.fileUrl,
          externalLink: created.externalLink,
          comment: created.comment,
        },
        ...prev,
      ]);
      setOpen(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Failed to create submission:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center -m-4 md:-m-6 bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500 shadow-indigo-500/20" />
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Syncing Submission Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 min-h-screen bg-[#0f172a] text-white p-6 md:p-8 -m-4 md:-m-6 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-inner">
               <FileText size={20} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">History Portal</span>
           </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            My Submissions
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-bold flex items-center gap-2 max-w-lg opacity-80">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            Track and manage your submitted contributions to assigned tasks.
          </p>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-4">
          <button 
             onClick={fetchData}
             className="p-4 rounded-[20px] bg-white/5 border border-white/10 text-indigo-400 hover:bg-white/10 transition-all active:scale-90 group"
             title="Sync Records"
           >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
           </button>
          <button
            onClick={() => setOpen(true)}
            className="flex group cursor-pointer items-center gap-3 rounded-[20px] bg-indigo-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-500 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.5)] active:scale-95"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
            <span>New Submission</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 font-bold flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-in fade-in slide-in-from-top-4 backdrop-blur-md mb-8">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
               <AlertCircle size={24} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 mb-1">Sync Alert</p>
               <p className="text-sm font-black text-white/90 leading-tight">{error}</p>
             </div>
          </div>
          <button 
             onClick={fetchData}
             className="px-8 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-[#0f172a] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center gap-2"
          >
             <RefreshCw size={14} />
             Retry Dashboard Sync
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <SummaryCard title="Total Contributions" value={total || "0"} color="slate" />
        <SummaryCard title="Quality Approved" value={approved || "0"} color="emerald" />
        <SummaryCard title="Under Verification" value={pending || "0"} color="indigo" />
      </div>

      {/* Submissions List Container */}
      <div className="rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-3xl overflow-hidden shadow-3xl group">
        <div className="border-b border-white/5 bg-white/5 px-10 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 shadow-inner">
                <Search size={22} />
             </div>
             <h2 className="text-xl font-black text-white uppercase tracking-widest">Submission History</h2>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-4 py-2 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
            {submissions.length} Records Found
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {submissions.length > 0 ? (
            submissions.map((item) => (
              <SubmissionRow key={item.id} item={item} />
            ))
          ) : (
            <div className="py-24 text-center">
              <div className="inline-flex p-8 rounded-[40px] bg-white/5 border border-white/5 mb-6 opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700">
                <FileText size={64} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-black text-2xl tracking-tight">No submissions found</p>
              <p className="text-slate-600 text-sm mt-3 font-medium max-w-xs mx-auto">Start by uploading your first task report to show up in the history records.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <NewSubmissionModal
          onClose={() => setOpen(false)}
          onSubmit={handleNewSubmission}
          pendingTasks={tasks}
        />
      )}
    </div>
  );
};

export default InternSubmissions;
