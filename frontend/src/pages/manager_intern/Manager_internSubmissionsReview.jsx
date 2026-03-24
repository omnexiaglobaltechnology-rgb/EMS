import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Clock, 
  User, 
  MessageSquare,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { tasksApi, submissionsApi, API_BASE_URL } from "../../utils/api";

const Manager_internSubmissionsReview = () => {
  const auth = useSelector((state) => state.auth);
  const currentUser = {
    id: auth.id,
    name: auth.name,
    role: auth.role,
  };

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchAllSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get all tasks to find those with submissions
      const tasks = await tasksApi.getAll();
      
      let allSubs = [];
      for (const task of tasks) {
        try {
          const taskId = task.id || task._id;
          if (!taskId) continue;
          
          const taskSubmissions = await submissionsApi.getByTask(taskId);
          if (taskSubmissions && Array.isArray(taskSubmissions)) {
            const mapped = taskSubmissions.map((sub) => {
              const internName = sub.submittedById?.name || sub.submittedBy?.name || "Unknown Intern";
              const reviewerRole = sub.reviewedById?.role || sub.reviewedBy?.role || null;
              
              return {
                id: sub._id || sub.id,
                intern: internName,
                task: task.title,
                submittedOn: new Date(sub.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                }),
                status: sub.status, // approved, rejected, pending
                reviewer: reviewerRole ? reviewerRole.replace(/_/g, " ").toUpperCase() : "-",
                fileUrl: sub.fileUrl || sub.externalLink || "#",
                comments: sub.reviewComment ? [sub.reviewComment] : [],
              };
            });
            allSubs = [...allSubs, ...mapped];
          }
        } catch (subErr) {
          console.error(`Error fetching submissions for task ${task.id}:`, subErr);
        }
      }
      
      // Sort by date (newest first)
      allSubs.sort((a, b) => new Date(b.submittedOn) - new Date(a.submittedOn));
      setSubmissions(allSubs);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      setError("Could not load submissions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSubmissions();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const reviewData = {
        reviewerId: currentUser.id,
        status: status, // "approved" or "rejected"
        reviewComment: "", 
      };
      
      await submissionsApi.review(id, reviewData);
      
      // Update local state
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status, reviewer: currentUser.role.toUpperCase() } : item,
        ),
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleAddComment = async (id, text) => {
    if (!text.trim()) return;
    
    try {
      const item = submissions.find(s => s.id === id);
      if (!item) return;

      const reviewData = {
        reviewerId: currentUser.id,
        status: item.status,
        reviewComment: text,
      };
      
      await submissionsApi.review(id, reviewData);
      
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, comments: [text] } : item,
        ),
      );
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert(`Error adding comment: ${err.message}`);
    }
  };

  const filteredData = submissions
    .filter((s) => s.intern.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => (filterStatus === "all" ? true : s.status === filterStatus));

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "rejected": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default: return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
             <FileText className="text-indigo-500" size={32} />
             Intern Submissions Review
          </h1>
          <p className="text-slate-400 font-bold mt-2 text-sm flex items-center gap-2">
            <User size={14} className="text-slate-500" />
            Active Reviewer: <span className="text-indigo-400">{currentUser.name}</span> ({currentUser.role})
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search interns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent pl-10 pr-4 py-2 text-sm font-bold text-white outline-none w-48 lg:w-64 placeholder:text-slate-600"
            />
          </div>
          <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
          <div className="relative flex items-center gap-2 px-3">
            <Filter size={16} className="text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm font-black text-white outline-none cursor-pointer appearance-none pr-6"
            >
              <option value="all" className="bg-[#0f172a]">All Status</option>
              <option value="pending" className="bg-[#0f172a]">Pending</option>
              <option value="approved" className="bg-[#0f172a]">Approved</option>
              <option value="rejected" className="bg-[#0f172a]">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 animate-in shake duration-500">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div 
              key={item.id} 
              className="group bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-3xl hover:bg-white/10 transition-all duration-500 shadow-xl relative overflow-hidden"
            >
              {/* Status Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                item.status === 'approved' ? 'bg-emerald-500' : 
                item.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
              }`}></div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0 shadow-inner">
                    <User size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">{item.intern}</h3>
                    <p className="text-indigo-300 font-bold text-sm mt-0.5">{item.task}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        <Clock size={12} /> {item.submittedOn}
                      </span>
                      <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                   {item.fileUrl && item.fileUrl !== "#" && (
                    <a
                      href={item.fileUrl.startsWith("http") ? item.fileUrl : `${API_BASE_URL.replace("/api", "")}${item.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all border border-indigo-500/20"
                    >
                      <ExternalLink size={14} /> PREVIEW SUBMISSION
                    </a>
                  )}

                  {currentUser.role !== "Intern" && item.status === "pending" && (
                    <div className="flex gap-2">
                       <button
                        onClick={() => handleStatusChange(item.id, "approved")}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                      >
                        <CheckCircle size={14} /> APPROVE
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, "rejected")}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                      >
                        <XCircle size={14} /> REJECT
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {item.status !== "pending" && (
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 w-fit">
                   <CheckCircle size={12} className={item.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'} />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     Reviewed by <span className="text-indigo-400">{item.reviewer}</span>
                   </p>
                </div>
              )}

              {/* Comments Section */}
              <div className="mt-8 border-t border-white/5 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} className="text-slate-500" />
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Feedback & Comments</h4>
                </div>
                
                <div className="space-y-3">
                  {item.comments.length === 0 ? (
                    <p className="text-xs text-slate-600 font-bold italic px-4">No feedback provided yet.</p>
                  ) : (
                    item.comments.map((c, i) => (
                      <div key={i} className="flex gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 animate-in slide-in-from-left-2 duration-300">
                        <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                          <MessageSquare size={12} />
                        </div>
                        <p className="text-sm font-bold text-slate-300">{c}</p>
                      </div>
                    ))
                  )}

                  {currentUser.role !== "Intern" && (
                    <div className="relative mt-4 group/input">
                      <input
                        type="text"
                        placeholder="Type a comment and press Enter..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddComment(item.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500/50 focus:ring-4 ring-indigo-500/5 transition-all placeholder:text-slate-700"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 group-focus-within/input:text-indigo-500 transition-colors pointer-events-none">
                        ENTER TO POST
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-xl">
             <AlertCircle size={64} className="text-slate-800 mb-6" />
             <h3 className="text-2xl font-black text-white uppercase tracking-widest">No Submissions Found</h3>
             <p className="text-slate-500 font-bold mt-2 tracking-widest">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Manager_internSubmissionsReview;
