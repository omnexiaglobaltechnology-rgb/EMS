/**
 * Component that renders a progress bar row illustrating a team's completion rate against a goal.
 *
 * @param {string} label - The descriptive label for the progress bar
 * @param {number} value - A percentage (0-100) indicating the progress completion
 */
const TeamProgressRow = ({ label, value }) => {
  return (
    <div className="mb-6 group">
      <div className="flex justify-between mb-2">
        <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">
          {label}
        </span>
        <span className="text-indigo-300 font-bold tabular-nums">{value}%</span>
      </div>

      <div className="h-2.5 rounded-full bg-white/5 border border-white/5 overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
};

export default TeamProgressRow;
