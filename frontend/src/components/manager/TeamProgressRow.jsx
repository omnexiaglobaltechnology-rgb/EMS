/**
 * Component that renders a progress bar row illustrating a team's completion rate against a goal.
 *
 * @param {string} label - The descriptive label for the progress bar
 * @param {number} value - A percentage (0-100) indicating the progress completion
 */
const TeamProgressRow = ({ label, value }) => {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-slate-500">{value}%</span>
      </div>

      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-indigo-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

export default TeamProgressRow;
