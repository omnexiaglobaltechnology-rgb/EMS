/**
 * Renders a compact row for a recently submitted report for manager interns.
 *
 * @param {string} title - The title of the report
 * @param {string} time - The relative or absolute time the report was submitted
 */
const RecentReportItems = ({ title, time }) => {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 mb-3">
      <span className="font-medium">{title}</span>
      <span className="text-sm text-slate-500">{time}</span>
    </div>
  );
};

export default RecentReportItems;
