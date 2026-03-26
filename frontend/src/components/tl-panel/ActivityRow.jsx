/**
 * Component for rendering a single recent activity item in a list format.
 * Primarily used within the team lead dashboard.
 *
 * @param {object} activity - The activity details including time, text description, and icon component
 */
const ActivityRow = ({ activity }) => {
  const Icon = activity.icon;

  return (
    <div className="flex items-start gap-4 p-5">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
        <Icon size={18} />
      </div>

      <div>
        <p className="text-sm font-medium text-slate-900">{activity.time}</p>
        <p className="text-sm text-slate-600">{activity.text}</p>
      </div>
    </div>
  );
};

export default ActivityRow;
