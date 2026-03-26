import { FileText, Link as LinkIcon } from "lucide-react";

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
      // Use relative path which is proxied by Vite
      window.open(item.fileUrl, "_blank");
    } else if (item.type === "link" && item.externalLink) {
      window.open(item.externalLink, "_blank");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-5">
      {/* Left */}
      <div className="space-y-1">
        <p className="font-medium text-slate-900">{item.task}</p>
        <p className="text-sm text-slate-500">
          Submitted on {item.submittedOn}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Type */}
        <div className="flex items-center gap-1 text-slate-500">
          {item.type === "file" ? (
            <FileText size={16} />
          ) : (
            <LinkIcon size={16} />
          )}
          <span className="text-sm capitalize">{item.type}</span>
        </div>

        {/* Status */}
        <StatusBadge status={item.status} />

        {/* Action */}
        <button
          onClick={handleView}
          disabled={!item.fileUrl && !item.externalLink}
          className="text-sm font-medium text-indigo-600 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          View
        </button>
      </div>
    </div>
  );
};

export default SubmissionRow;
