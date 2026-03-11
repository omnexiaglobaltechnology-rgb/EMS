import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Github, FileText, CheckCircle, XCircle } from "lucide-react";

import SubmissionStatusBadge from "../../components/tl-panel/SubmissionStatusBadge";
import DiffProgressBar from "../../components/tl-panel/DiffProgressBar";
import { submissionsApi } from "../../utils/api";

import { Link } from "react-router-dom";

/**
 * Submission review portal for Team Leads.
 * Aggregates all intern submissions across tasks and facilitates the review/approval workflow.
 */
const TlSubmissionsReview = () => {
  const { id: currentUserId } = useSelector((state) => state.auth);
  const [submissions, setSubmissions] = useState([]);
  const [active, setActive] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch submissions on mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Set first submission as active when submissions load
  useEffect(() => {
    if (submissions.length > 0 && !active) {
      setActive(submissions[0]);
    }
  }, [submissions]);

  /**
   * Fetches all tasks and their associated submissions to build a comprehensive review list.
   */
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      // Get all tasks first to map task IDs
      const { tasksApi } = await import("../../utils/api");
      const tasks = await tasksApi.getAll();

      // For each task, get submissions
      let allSubmissions = [];
      for (const task of tasks) {
        try {
          const taskSubmissions = await submissionsApi.getByTask(task.id);
          const mapped = taskSubmissions.map((sub) => ({
            ...sub,
            task: task.title,
            intern: sub.submittedBy?.name || "Unknown",
            type: sub.fileUrl
              ? "File Upload"
              : sub.externalLink
                ? "External Link"
                : "Comment",
            submittedAt: new Date(sub.createdAt).toLocaleDateString(),
            statusBadge:
              sub.status === "pending"
                ? "Pending Review"
                : sub.status === "approved"
                  ? "Approved"
                  : "Changes Requested",
          }));
          allSubmissions = [...allSubmissions, ...mapped];
        } catch (e) {
          console.error(`Error fetching submissions for task ${task.id}:`, e);
        }
      }

      setSubmissions(allSubmissions);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submits a formal review for a specific submission via API.
   *
   * @param {string} statusBadge - Status label ('Approved', 'Changes Requested', etc.)
   */
  const updateStatus = async (statusBadge) => {
    if (!active) return;

    try {
      const statusMap = {
        "Pending Review": "pending",
        "Changes Requested": "rejected",
        Approved: "approved",
      };

      const reviewData = {
        reviewerId: currentUserId || "unknown",
        status: statusMap[statusBadge],   // FIX: was referencing undefined 'status'
        reviewComment: feedback,
      };

      await submissionsApi.review(active.id, reviewData);

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === active.id ? { ...s, statusBadge } : s,
        ),
      );
      setActive((prev) => ({ ...prev, statusBadge }));
      setFeedback("");
      setError(null);
    } catch (err) {
      console.error("[updateStatus] ERROR:", err);
      setError(`Failed to update submission: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-600">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Error message */}
      {error && (
        <div className="lg:col-span-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* ---------------- LEFT PANEL ---------------- */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-gray-300 p-4 font-semibold">
          Pending Submissions (
          {submissions.filter((s) => s.status === "pending").length})
        </div>

        <div className="divide-y divide-gray-300">
          {submissions.length > 0 ? (
            submissions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                className={`w-full p-4 text-left hover:bg-slate-100 ${active?.id === s.id ? "bg-slate-100" : ""
                  }`}
              >
                <p className="font-medium">{s.intern}</p>
                <p className="text-sm text-slate-600">Task: {s.task}</p>
                <p className="text-sm text-slate-500">Type: {s.type}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Submitted: {s.submittedAt}
                </p>

                <SubmissionStatusBadge value={s.statusBadge} />
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-slate-500">
              No submissions found
            </div>
          )}
        </div>
      </div>

      {/* ---------------- RIGHT PANEL ---------------- */}
      {active && (
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">
              Reviewing: {active.task} – {active.intern}
            </h2>
          </div>

          {/* File Preview */}
          {active.fileUrl && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <FileText size={18} />
                Uploaded File
              </div>
              <a
                href={`${active.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded border border-gray-400 px-4 py-2 text-sm hover:bg-slate-100"
              >
                View/Download File
              </a>
              {active.comment && (
                <p className="text-sm text-slate-600 mt-3">{active.comment}</p>
              )}
            </div>
          )}

          {/* External Link Preview */}
          {active.externalLink && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Github size={18} />
                External Link
              </div>
              <a
                href={active.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded border border-gray-400 px-4 py-2 text-sm hover:bg-slate-100 truncate"
              >
                {active.externalLink}
              </a>
              {active.comment && (
                <p className="text-sm text-slate-600 mt-3">{active.comment}</p>
              )}
            </div>
          )}

          {/* Feedback */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h3 className="font-medium">Evaluation & Feedback</h3>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter specific feedback for the intern..."
              className="w-full rounded border border-gray-400 px-3 py-2 text-sm"
              rows={5}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => updateStatus("Changes Requested")}
                className="flex items-center gap-2 rounded border border-gray-400 px-4 py-2 text-sm"
              >
                <XCircle size={16} />
                Request Changes
              </button>

              <button
                onClick={() => updateStatus("Approved")}
                className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm text-white"
              >
                <CheckCircle size={16} />
                Approve Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TlSubmissionsReview;
