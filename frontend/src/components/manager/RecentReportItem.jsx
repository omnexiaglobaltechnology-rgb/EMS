/**
 * Renders a compact row for a recently submitted report.
 *
 * @param {string} title - The title of the report
 * @param {string} time - The time the report was submitted
 */
const RecentReportItem = ({ title, time }) => {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 px-5 py-4 mb-4 transition-all duration-300 hover:bg-white/10 hover:border-white/10 group cursor-default shadow-sm">
      <div className="flex flex-col">
        <span className="font-semibold text-slate-100 group-hover:text-white transition-colors">
          {title}
        </span>
        <span className="text-xs text-slate-500 mt-1 uppercase tracking-tighter">Report Type: Performance</span>
      </div>
      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-medium border border-slate-700 shadow-sm">
        {time}
      </span>
    </div>
  );
};

export default RecentReportItem;
