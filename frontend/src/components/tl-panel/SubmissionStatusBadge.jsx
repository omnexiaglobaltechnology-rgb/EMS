/**
 * A badge specifically styled to display the review status of an intern's submission.
 *
 * @param {string} value - The submission status (e.g., "Pending Review", "Approved")
 */
const SubmissionStatusBadge = ({ value }) => {
  const map = {
    "Pending Review": "bg-yellow-100 text-yellow-700",
    "Changes Requested": "bg-red-100 text-red-600",
    Approved: "bg-green-100 text-green-600",
  };

  return (
    <span
      className={`inline-block mt-2 rounded-full px-3 py-1 text-xs font-medium ${map[value]}`}
    >
      {value}
    </span>
  );
};

export default SubmissionStatusBadge;
