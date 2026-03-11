import { useState } from "react";
import { Github, FileText, CheckCircle, XCircle } from "lucide-react";

import SubmissionStatusBadge from "../../components/tl-panel/SubmissionStatusBadge";
import DiffProgressBar from "../../components/tl-panel/DiffProgressBar";

import { Link } from "react-router-dom";

const submissionsData = [
  {
    id: 1,
    intern: "Sarah Jones",
    task: "React Component Refactor",
    type: "GitHub PR",
    submittedAt: "Today, 10:30 AM",
    status: "Pending Review",
    pr: {
      title: "feat/button-component-update",
      description:
        "Refactored primary and secondary buttons to use new design tokens. Added tests.",
      additions: 150,
      deletions: 45,
      url: "#",
    },
  },
  {
    id: 2,
    intern: "David Lee",
    task: "Q4 Market Research",
    type: "Google Sheet",
    submittedAt: "Yesterday",
    status: "Pending Review",
  },
  {
    id: 3,
    intern: "Emily Chen",
    task: "App Icon Design",
    type: "Screenshot",
    submittedAt: "Oct 25",
    status: "Changes Requested",
  },
];

/**
 * Intern submission review interface for TL Interns.
 * Allows feedback and status updates for peer submissions.
 */
const TlSubmissionsReview = () => {
  const [submissions, setSubmissions] = useState(submissionsData);
  const [active, setActive] = useState(submissions[0]);
  const [feedback, setFeedback] = useState("");

  /**
   * Updates the review status of the active submission.
   *
   * @param {string} status - New submission status
   */
  const updateStatus = (status) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === active.id ? { ...s, status } : s)),
    );
    setActive((prev) => ({ ...prev, status }));
    setFeedback("");
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ---------------- LEFT PANEL ---------------- */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-gray-300 p-4 font-semibold">
          Pending Submissions ({submissions.length})
        </div>

        <div className="divide-y divide-gray-300">
          {submissions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className={`w-full p-4 text-left hover:bg-slate-100 ${
                active.id === s.id ? "bg-slate-100" : ""
              }`}
            >
              <p className="font-medium">{s.intern}</p>
              <p className="text-sm text-slate-600">Task: {s.task}</p>
              <p className="text-sm text-slate-500">Type: {s.type}</p>
              <p className="text-xs text-slate-400 mt-1">
                Submitted: {s.submittedAt}
              </p>

              <SubmissionStatusBadge value={s.status} />
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- RIGHT PANEL ---------------- */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">
            Reviewing: {active.task} – {active.intern}
          </h2>
        </div>

        {/* Preview */}
        {active.pr && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <Github size={18} />
              GitHub PR #{active.id}: {active.pr.title}
            </div>

            <p className="text-sm text-slate-600">{active.pr.description}</p>

            <DiffProgressBar
              additions={active.pr.additions}
              deletions={active.pr.deletions}
            />

            <Link
              href={active.pr.url}
              className="inline-block rounded border border-gray-400 px-4 py-2 text-sm hover:bg-slate-100"
            >
              View Full PR on GitHub
            </Link>
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
    </div>
  );
};

export default TlSubmissionsReview;
