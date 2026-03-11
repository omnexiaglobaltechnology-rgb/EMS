/**
 * A minimalist card component designed to display a brief summary metric.
 *
 * @param {string} title - The title of the summary metric
 * @param {string|number} value - The numerical or text value of the metric
 * @param {string} [color="slate"] - Tailwind color palette name indicating the value's text color
 */
const SummaryCard = ({ title, value, color = "slate" }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-1 text-2xl font-semibold text-${color}-600`}>{value}</p>
    </div>
  );
};

export default SummaryCard;
