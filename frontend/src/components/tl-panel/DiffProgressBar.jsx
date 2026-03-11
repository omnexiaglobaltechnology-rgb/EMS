/**
 * A composite progress bar visualizing code additions versus deletions.
 *
 * @param {number} additions - Total number of added lines
 * @param {number} deletions - Total number of deleted lines
 */
const DiffProgressBar = ({ additions, deletions }) => {
  const total = additions + deletions;

  const additionsPercent = total ? (additions / total) * 100 : 0;

  const deletionsPercent = total ? (deletions / total) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Numbers */}
      <div className="text-sm">
        <span className="font-medium text-green-600">
          +{additions} additions
        </span>
        <span className="ml-2 font-medium text-red-600">
          -{deletions} deletions
        </span>
      </div>

      {/* Progress Bar */}
      <div className="flex h-1 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="bg-green-500"
          style={{ width: `${additionsPercent}%` }}
        />
        <div className="bg-red-500" style={{ width: `${deletionsPercent}%` }} />
      </div>
    </div>
  );
};

export default DiffProgressBar;
