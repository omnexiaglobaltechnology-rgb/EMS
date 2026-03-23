import {
  FileText,
  Link as LinkIcon,
  MessageSquare,
  CornerDownRight,
} from "lucide-react";

import StatusBadge from "./StatusBadge";

/**
 * Component that displays an individual submission (file or link) related to a task.
 * Provides functionality to view the attached file or externally linked content.
 *
 * @param {object} item - The submission data (task, type, status, fileUrl, externalLink, etc.)
 */
const SubmissionRow = ({ item }) => {
  /**
   * Opens either the attached file or the external link in a new browser tab.
   */
  const handleView = () => {
    if (item.type === "file" && item.fileUrl) {
      const url = item.fileUrl.startsWith("http")
        ? item.fileUrl
        : `http://localhost:5000${item.fileUrl}`;
      window.open(url, "_blank");
    } else if (item.type === "link" && item.externalLink) {
      window.open(item.externalLink, "_blank");
    }
  };

  return (
    <div className="flex flex-col p-7 hover:bg-white/5 transition-all group border-b border-white/5 last:border-0 relative overflow-hidden">
      {/* Main Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-all duration-500 pointer-events-none" />

        {/* Left */}
        <div className="space-y-2 flex-1 relative z-10">
          <p className="font-black text-xl text-white group-hover:text-indigo-300 transition-colors tracking-tight">
            {item.task}
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            Submitted on{" "}
            <span className="text-slate-400">{item.submittedOn}</span>
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-8 relative z-10">
          {/* Type */}
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 text-slate-400 group-hover:text-white transition-all">
            {item.type === "file" ? (
              <FileText size={16} strokeWidth={2.5} />
            ) : (
              <LinkIcon size={16} strokeWidth={2.5} />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {item.type}
            </span>
          </div>

          {/* Status */}
          <StatusBadge status={item.status} />

          {/* Action */}
          <button
            onClick={handleView}
            disabled={!item.fileUrl && !item.externalLink}
            className="px-6 py-2.5 rounded-xl bg-indigo-600/10 border border-indigo-600/20 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-600/10 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            View Source
          </button>
        </div>
      </div>

      {/* Expanded Feedback & Note Section */}
      {(item.comment || item.feedback) && (
        <div className="mt-6 ml-4 pl-6 border-l-2 border-white/5 space-y-4 relative animate-in slide-in-from-left duration-500">
          {item.comment && (
            <div className="flex gap-4 items-start">
              <div className="mt-1.5 text-slate-600">
                <CornerDownRight size={14} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1 block">
                  Your Note:
                </span>
                <p className="text-sm font-bold text-slate-400 italic">
                  "{item.comment}"
                </p>
              </div>
            </div>
          )}

          {item.feedback && (
            <div className="p-5 rounded-[24px] bg-indigo-500/5 border border-indigo-500/20 flex gap-4 items-start shadow-xl shadow-black/20">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                <MessageSquare size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                    Manager Feedback
                  </span>
                  <span className="h-1 w-1 rounded-full bg-indigo-900" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    Reviewer: {item.reviewer}
                  </span>
                </div>
                <p className="text-sm font-black text-slate-200 leading-relaxed">
                  {item.feedback}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubmissionRow;
