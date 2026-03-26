// eslint-disable-next-line no-unused-vars
/**
 * A specialized card component used by manager interns to display key metrics and trends.
 *
 * @param {string} title - The metric title
 * @param {string|number} value - The primary statistic value
 * @param {string} change - A descriptive string illustrating the recent change or trend
 * @param {React.ElementType} icon - Icon component to visually represent the metric
 * @param {boolean} negative - Whether the trend is inherently negative, to trigger conditional styling
 */
const MetricsCard = ({ title, value, change, icon: Icon, negative }) => {
  return (
    <div className="rounded-xl border border-gray-300 bg-white p-6 flex justify-between">
      <div>
        <p className="text-slate-500">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        <p
          className={`mt-2 text-sm ${
            negative ? "text-green-600" : "text-green-600"
          }`}
        >
          {change}
        </p>
      </div>

      <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
        <Icon size={22} />
      </div>
    </div>
  );
};

export default MetricsCard;
