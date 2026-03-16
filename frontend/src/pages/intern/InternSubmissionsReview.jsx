import { useState } from "react";

// Dummy logged-in user
const currentUser = {
  name: "Ritesh",
  role: "Manager", // Change: Intern | Team Lead | Manager
};

const initialData = [
  {
    id: 1,
    intern: "Rahul",
    task: "Dashboard UI",
    submittedOn: "Feb 10, 2026",
    status: "pending",
    reviewer: "-",
    fileUrl: "https://example.com/file1.pdf",
    comments: [],
  },
  {
    id: 2,
    intern: "Priya",
    task: "API Integration",
    submittedOn: "Feb 12, 2026",
    status: "approved",
    reviewer: "Team Lead",
    fileUrl: "https://example.com/file2.pdf",
    comments: ["Good work"],
  },
];

/**
 * Peer or manager review interface for intern submissions.
 * Allows evaluators to approve/reject work and provide feedback.
 */
const InternSubmissionsReview = () => {
  const [submissions, setSubmissions] = useState(initialData);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Approve / Reject
  /**
   * Updates the status of a submission and records the reviewer's role.
   *
   * @param {number|string} id - Submission identifier
   * @param {string} status - New status ('approved', 'rejected')
   */
  const handleStatusChange = (id, status) => {
    setSubmissions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status, reviewer: currentUser.role } : item,
      ),
    );
  };

  // Add Comment
  /**
   * Appends a text comment to a specific submission.
   *
   * @param {number|string} id - Submission identifier
   * @param {string} text - Comment content
   */
  const handleAddComment = (id, text) => {
    setSubmissions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, comments: [...item.comments, text] } : item,
      ),
    );
  };

  // Filter + Search
  const filteredData = submissions
    .filter((s) => s.intern.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => (filterStatus === "all" ? true : s.status === filterStatus));

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Intern Submissions Review</h1>

      {/* Search + Filter */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by intern name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl">
        {filteredData.map((item) => (
          <div key={item.id} className="border-b p-4 space-y-2">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{item.intern}</p>
                <p>{item.task}</p>
                <p className="text-sm text-gray-500">{item.submittedOn}</p>
                <p className="text-sm">
                  Status: <span className="font-medium">{item.status}</span>
                </p>
              </div>

              {/* Role-based Buttons */}
              {currentUser.role !== "Intern" && item.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(item.id, "approved")}
                    className="bg-green-500 text-white h-7 px-3 text-sm rounded-md"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleStatusChange(item.id, "rejected")}
                    className="bg-red-500 text-white h-7 px-3 text-sm rounded-md"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>

            {/* Reviewer */}
            {item.status !== "pending" && (
              <p className="text-sm text-gray-500">
                Reviewed by {item.reviewer}
              </p>
            )}

            {/* File Preview */}
            <a
              href={item.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline text-sm"
            >
              Preview File
            </a>

            {/* Comments */}
            <div className="mt-2">
              <p className="text-sm font-medium">Comments:</p>

              {item.comments.map((c, i) => (
                <p key={i} className="text-sm text-gray-600">
                  • {c}
                </p>
              ))}

              {currentUser.role !== "Intern" && (
                <input
                  type="text"
                  placeholder="Add comment..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddComment(item.id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="border mt-2 px-2 py-1 rounded w-full"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternSubmissionsReview;
