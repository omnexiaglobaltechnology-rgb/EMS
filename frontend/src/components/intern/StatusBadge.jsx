/**
 * A visual badge indicating the current state of an item (e.g., approved, pending, rejected).
 * Colors dynamically adapt based on the provided status.
 *
 * @param {string} status - A predefined status string determining the badge color
 */
const StatusBadge = ({ status }) => {
  const styles = {
    approved: "bg-emerald-100 text-emerald-600",
    pending: "bg-indigo-100 text-indigo-600",
    rejected: "bg-red-100 text-red-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
