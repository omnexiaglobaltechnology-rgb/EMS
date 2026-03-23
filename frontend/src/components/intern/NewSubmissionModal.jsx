import { X, Upload, FileText } from "lucide-react";
import { useState } from "react";

/**
 * Component providing a modal form for interns to submit task deliverables.
 * Allows submission of either an uploaded file or an external link URL along with an optional comment.
 *
 * @param {function} onClose - Callback invoked to close the modal interface
 * @param {function} onSubmit - Callback invoked with the submitted data (taskId, type, file/externalLink, comment)
 * @param {object[]} pendingTasks - Array of available tasks allowing the intern to select which task they are submitting for
 */
const NewSubmissionModal = ({ onClose, onSubmit, pendingTasks = [] }) => {
  // Local state for all form fields
  const [type, setType] = useState("file");
  const [task, setTask] = useState("");
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [comment, setComment] = useState("");

  /**
   * Submission interceptor. Prevents default browser refresh and ensures required
   * fields (task selection, and either a file or a link depending on the type) are provided.
   * @param {Event} e - Form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task || (type === "file" && !file) || (type === "link" && !link))
      return;
    onSubmit({
      taskId: task,
      type,
      file,
      externalLink: link,
      comment,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-[40px] bg-[#0f172a] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header (Non-scrolling) */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-white/5 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white">
              New Submission
            </h2>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">
              Finalize Your Task Deliverables
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar" onSubmit={handleSubmit}>
          {/* Select Task Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block px-2">Select Target Goal</label>
            <div className="relative group">
              <select
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm focus:bg-white/10 focus:border-indigo-500 transition-all outline-none font-bold text-white appearance-none cursor-pointer shadow-lg hover:border-white/20"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                required
              >
                <option value="" className="bg-[#0f172a]">Choose an assigned task...</option>
                {pendingTasks.length === 0 ? (
                  <option value="" disabled className="bg-[#0f172a]">No pending tasks available</option>
                ) : (
                  pendingTasks.map((t) => (
                    <option key={t.id || t._id} value={t.id || t._id} className="bg-[#0f172a]">
                      {t.title} — ({t.displayStatus?.toUpperCase() || t.status?.toUpperCase() || "NEW"})
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-indigo-400 transition-colors">
                 <Upload size={16} />
              </div>
            </div>
          </div>

          {/* Submission Choice */}
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block px-2">Deliverable Type</label>
             <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl mb-8 border border-white/5">
                {["file", "link"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all duration-300
                      ${type === t
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      }`}
                  >
                    {t === "file" ? "Document Upload" : "External Link"}
                  </button>
                ))}
             </div>
          </div>

          {/* Content Area */}
          <div className="space-y-4">
            {type === "file" ? (
              <div className="group relative">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 p-12 text-slate-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                  <div className="p-5 rounded-2xl bg-indigo-500/10 text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                    <Upload size={32} strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">Select Submission File</p>
                    <p className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-widest">DRAG & DROP OR BROWSE</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                    required={type === "file"}
                  />
                </label>
                
                {file && (
                  <div className="mt-4 flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                       <FileText className="text-emerald-400" size={18} />
                       <span className="text-xs font-black text-emerald-300 truncate max-w-xs">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block px-2">External URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/your-repo/project..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm focus:bg-white/10 focus:border-indigo-500 transition-all outline-none font-bold text-white placeholder:text-slate-700 shadow-xl"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  required={type === "link"}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block px-2">Optional Notes</label>
             <textarea
                placeholder="Include brief details about your submission..."
                className="w-full h-32 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm focus:bg-white/10 focus:border-indigo-500 transition-all outline-none font-medium text-white resize-none placeholder:text-slate-700 shadow-xl"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-6 pt-6 border-t border-white/5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              className="rounded-[20px] bg-indigo-600 px-12 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-500 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-indigo-500 active:scale-95"
            >
              Confirm Submission
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSubmissionModal;
