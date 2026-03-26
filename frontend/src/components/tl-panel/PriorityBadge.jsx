/**
 * Renders a small badge displaying task priority (High, Medium, Low) with corresponding colors.
 *
 * @param {string} value - The priority level to display
 */
const PriorityBadge = ({ value }) => {
  const map = {
    High: "bg-red-100 text-red-600",
    Medium: "bg-yellow-100 text-yellow-600",
    Low: "bg-green-100 text-green-600",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${map[value]}`}
    >
      {value}
    </span>
  );
};

export default PriorityBadge;
