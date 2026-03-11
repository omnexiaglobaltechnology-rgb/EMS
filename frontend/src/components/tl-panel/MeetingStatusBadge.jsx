/**
 * Simple status badge styling meeting states (e.g., Scheduled, Ongoing).
 *
 * @param {string} value - The meeting status string to display
 */
const MeetingStatusBadge = ({ value }) => {
  const map = {
    Scheduled: "bg-blue-100 text-blue-600",
    Ongoing: "bg-green-100 text-green-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${map[value]}`}
    >
      {value}
    </span>
  );
};

export default MeetingStatusBadge;
