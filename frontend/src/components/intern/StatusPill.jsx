/**
 * A pill-shaped status indicator, primarily used for tasks or submissions.
 * Maps specific statuses (pending, in-progress, review, completed) to visually distinct styles and text.
 *
 * @param {string} status - The current status of the item
 */
const StatusPill = ({ status }) => {
  const map = {
    pending: "bg-indigo-100 text-indigo-600",
    "in-progress": "bg-indigo-100 text-indigo-600",
    review: "bg-indigo-100 text-indigo-600",
    completed: "bg-emerald-100 text-emerald-600",
  };

  const labelMap = {
    pending: "Pending",
    "in-progress": "In Progress",
    review: "In Review",
    completed: "Completed",
  };

  return (
    <span
      className={`rounded-full px-4 py-1 text-xs font-medium ${map[status]}`}
    >
      {labelMap[status]}
    </span>
  );
};

export default StatusPill;
