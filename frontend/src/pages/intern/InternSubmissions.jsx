import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import { Plus } from "lucide-react";

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
  }, []);

  /**
   * Fetches tasks and their associated submissions to populate the history table.
   */
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch tasks assigned to this intern
      const allTasks = await tasksApi.getAll();

      if (!Array.isArray(allTasks)) {
        throw new Error(
          `Invalid tasks response: expected an array but got ${typeof allTasks}`,
        );
      }

      const internTasks = allTasks.filter(
        (task) => task.assignedToId === internId,
      );

      setTasks(internTasks);

      // Fetch all submissions for these tasks
      let allSubmissions = [];
      for (const task of internTasks) {
        try {
          const taskSubmissions = await submissionsApi.getByTask(task.id);
          if (!Array.isArray(taskSubmissions)) {
            console.warn(`Invalid submissions response for task ${task.id}`);
            continue;
          }
          const mapped = taskSubmissions
            .filter((sub) => sub.submittedById === internId)
            .map((sub) => ({
              id: sub.id,
              task: task.title,
              taskId: task.id,
              type: sub.fileUrl
                ? "file"
                : sub.externalLink
                  ? "link"
                  : "comment",
              submittedOn: new Date(sub.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              status:
                sub.status === "pending"
                  ? "pending"
                  : sub.status === "approved"
                    ? "approved"
                    : "rejected",
              reviewer: sub.reviewedBy?.name || "-",
              fileUrl: sub.fileUrl,
              externalLink: sub.externalLink,
              comment: sub.comment,
            }));
          allSubmissions = [...allSubmissions, ...mapped];
        } catch (e) {
          console.error(`Error fetching submissions for task ${task.id}:`, e);
        }
      }

      setSubmissions(
        allSubmissions.sort(
          (a, b) => new Date(b.submittedOn) - new Date(a.submittedOn),
        ),
      );
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

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
      if (!created || !created.id) {
        setError("Failed to create submission: invalid response");
        return;
      }

      const task = tasks.find((t) => t.id === created.taskId);

      setSubmissions((prev) => [
        {
          id: created.id,
          task: task?.title || "Unknown",
          taskId: created.taskId,
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
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-600">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            My Submissions
          </h1>
          <p className="mt-1 text-slate-500">
            Submit and track your assigned work
          </p>
        </div>

        {/* New Submission */}
        <button
          onClick={() => setOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          New Submission
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard title="Total" value={total} />
        <SummaryCard title="Approved" value={approved} color="emerald" />
        <SummaryCard title="Pending" value={pending} color="indigo" />
      </div>

      {/* Submissions List */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-medium text-slate-900">Submission History</h2>
        </div>

        {submissions.length > 0 ? (
          <div className="divide-y divide-gray-300">
            {submissions.map((item) => (
              <SubmissionRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-5 text-center text-slate-500">
            No submissions yet
          </div>
        )}
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
