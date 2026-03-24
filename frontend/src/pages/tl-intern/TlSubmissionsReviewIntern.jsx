import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { 
  Github, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Search, 
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronRight,
  MessageSquare
} from "lucide-react";

import { tasksApi, submissionsApi } from "../../utils/api";

/**
 * Premium Review Interface for TL Interns.
 * Features a dual-pane layout with glassmorphism aesthetics and real-time data sync.
 */
const TlSubmissionsReviewIntern = () => {
  const { id: currentUserId } = useSelector((state) => state.auth);
  const [submissions, setSubmissions] = useState([]);
  const [active, setActive] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch submissions on mount
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Set first submission as active when submissions load
  useEffect(() => {
    if (submissions.length > 0 && !active) {
      setActive(submissions[0]);
    }
  }, [submissions, active]);

  /**
   * Fetches all tasks and their associated submissions to build a comprehensive review list.
   */
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const tasks = await tasksApi.getAll();

      let allSubmissions = [];
      for (const task of tasks) {
        try {
          const taskId = task.id || task._id;
          if (!taskId) continue;
          const taskSubmissions = await submissionsApi.getByTask(taskId);
          
          if (Array.isArray(taskSubmissions)) {
            const mapped = taskSubmissions.map((sub) => ({
              ...sub,
              id: sub.id || sub._id,
              task: task.title,
              taskId: taskId,
              intern: sub.submittedById?.name || sub.submittedBy?.name || "Unknown Intern",
              type: sub.fileUrl ? "File" : sub.externalLink ? "Link" : "Comment",
              submittedAt: new Date(sub.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              }),
              timeAgo: new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              statusLabel: sub.status === "pending" || sub.status === "submitted" 
                ? "Pending Review" 
                : sub.status === "approved" || sub.status === "completed" 
                  ? "Approved" 
                  : "Changes Requested",
            }));
            allSubmissions = [...allSubmissions, ...mapped];
          }
        } catch (_e) {
          console.warn(`Could not fetch submissions for task ${task.id}`, _e);
        }
      }

      // Sort by newest first
      allSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSubmissions(allSubmissions);
      setError(null);
    } catch (err) {
      setError("Failed to sync submission records. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Submits a formal review for a specific submission via API.
   * @param {string} statusLabel - Friendly status label
   */
  const updateStatus = async (statusLabel) => {
    if (!active) return;

    try {
      const statusMap = {
        "Pending Review": "pending",
        "Changes Requested": "rejected",
        "Approved": "approved",
      };

      const reviewData = {
        reviewerId: currentUserId,
        status: statusMap[statusLabel],
        reviewComment: feedback,
      };

      await submissionsApi.review(active.id, reviewData);

      // Update local state for immediate feedback
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === active.id ? { ...s, statusLabel, status: statusMap[statusLabel] } : s
        )
      );
      setActive((prev) => ({ ...prev, statusLabel, status: statusMap[statusLabel] }));
      setFeedback("");
      setError(null);
    } catch (err) {
      setError(`Failed to update review: ${err.message}`);
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    s.intern.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.task.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "Approved": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Changes Requested": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default: return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center -m-4 md:-m-6 bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500 shadow-indigo-500/20" />
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Initializing Review Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 min-h-screen bg-[#0f172a] text-white p-6 md:p-8 -m-4 md:-m-6 font-sans">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-inner">
               <CheckCircle size={20} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Quality Assurance</span>
           </div>
          <h1 className="text-3xl md:text-3xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Submission Review
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-bold flex items-center gap-2 max-w-lg opacity-80">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            Evaluate and provide feedback for peer intern deliverables.
          </p>
        </div>

        {/* Search */}
        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by intern or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold outline-none focus:bg-white/10 focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 animate-in shake duration-500">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">
        {/* PANEL: LIST */}
        <div className="lg:col-span-4 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-3xl overflow-hidden flex flex-col shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Recent Records</h2>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black border border-indigo-500/20">
              {filteredSubmissions.length} TOTAL
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5 max-h-[700px]">
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s)}
                  className={`w-full p-8 text-left transition-all relative group ${
                    active?.id === s.id ? "bg-indigo-600/10" : "hover:bg-white/5"
                  }`}
                >
                  {active?.id === s.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10" />
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-white text-base tracking-tight group-hover:text-indigo-300 transition-colors uppercase">{s.intern}</p>
                    <ChevronRight size={16} className={`text-slate-600 group-hover:translate-x-1 transition-transform ${active?.id === s.id ? "text-indigo-500" : ""}`} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 line-clamp-1 mb-4 uppercase tracking-wider">Task: {s.task}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">{s.type} Deliverable</span>
                      <span className="text-[10px] font-black text-slate-500">{s.submittedAt}</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(s.statusLabel)}`}>
                      {s.statusLabel}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-20 text-center opacity-20 grayscale">
                <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">No matches found</p>
              </div>
            )}
          </div>
        </div>

        {/* PANEL: DETAIL */}
        <div className="lg:col-span-8 space-y-8 animate-in slide-in-from-right-10 duration-500">
          {active ? (
            <>
              {/* Submission Info Card */}
              <div className="rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-3xl p-10 shadow-2xl relative overflow-hidden group/detail">
                <div className="absolute top-0 right-0 p-12 opacity-5 -mr-8 -mt-8 pointer-events-none group-hover/detail:scale-110 transition-transform duration-1000">
                  <FileText size={200} />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="h-16 w-16 rounded-[24px] bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                        <User size={32} strokeWidth={2.5} />
                     </div>
                     <div>
                       <h3 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">{active.intern}</h3>
                       <p className="text-indigo-400 font-black uppercase tracking-widest text-[9px] mt-1">{active.task}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-3">Deliverable Asset</label>
                        {active.fileUrl ? (
                          <a
                            href={active.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
                          >
                            <FileText size={18} />
                            <span>Download Submission File</span>
                            <ExternalLink size={14} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                          </a>
                        ) : active.externalLink ? (
                           <a
                            href={active.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl group"
                          >
                            <Github size={18} />
                            <span>Open Project Link</span>
                            <ExternalLink size={14} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                          </a>
                        ) : (
                          <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-slate-500 italic text-sm font-bold">
                            Text-based submission only
                          </div>
                        )}
                      </div>

                      {active.comment && (
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-3">Intern Remarks</label>
                          <p className="text-slate-300 text-sm font-medium leading-relaxed bg-white/5 p-6 rounded-3xl border border-white/5 shadow-inner italic">
                            &quot;{active.comment}&quot;
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                       <div>
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-3">Submission Status</label>
                         <div className={`inline-block px-6 py-4 rounded-2xl border ${getStatusStyle(active.statusLabel)} font-black text-xs uppercase tracking-widest shadow-lg`}>
                            {active.statusLabel}
                         </div>
                       </div>
                       
                       <div className="flex gap-10">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-1">Date</label>
                            <p className="text-white font-black text-sm">{active.submittedAt}</p>
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-1">Timestamp</label>
                            <p className="text-white font-black text-sm">{active.timeAgo}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Form */}
              <div className="rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-3xl p-10 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 shadow-inner">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Quality Feedback</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Enter professional evaluation</p>
                  </div>
                </div>

                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Draft your evaluation notes here. Be specific about required changes or areas of excellence..."
                  className="w-full h-40 rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-sm font-medium text-white placeholder:text-slate-700 focus:bg-white/10 focus:border-indigo-500/50 outline-none transition-all resize-none shadow-inner mb-10"
                />

                <div className="flex flex-col md:flex-row justify-end gap-6">
                  <button
                    onClick={() => updateStatus("Changes Requested")}
                    className="flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] border border-rose-500/30 text-rose-400 font-black text-xs uppercase tracking-widest hover:bg-rose-500/10 transition-all active:scale-95 group"
                  >
                    <XCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    Request Revision
                  </button>

                  <button
                    onClick={() => updateStatus("Approved")}
                    className="flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-95 group"
                  >
                    <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
                    Approve Submission
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center rounded-[40px] border border-white/5 bg-white/5 backdrop-blur-3xl py-40 grayscale opacity-40">
              <FileText size={80} className="text-slate-500 mb-6" />
              <p className="text-xl font-black text-slate-400 uppercase tracking-[0.2em] text-center max-w-xs">Select a submission to begin review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TlSubmissionsReviewIntern;
