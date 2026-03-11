import { CheckSquare, Calendar, FileText } from "lucide-react";

const activities = [
  {
    time: "10:30 AM",
    text: 'Task "Project Research" updated with new requirements',
    icon: CheckSquare,
    color: "indigo",
  },
  {
    time: "11:15 AM",
    text: 'Meeting "Weekly Sync" schedule confirmed for 2:00 PM',
    icon: Calendar,
    color: "sky",
  },
  {
    time: "12:00 PM",
    text: 'Submission "Q4 Report Draft" uploaded successfully',
    icon: FileText,
    color: "emerald",
  },
];

/**
 * Renders a list of the most recent activities relevant to the intern.
 * Hardcoded activities list maps different updates (tasks, meetings, submissions) to specific visual icons and colors.
 */
const RecentActivity = () => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>

      {/* Activity list */}
      <div className="mt-6 space-y-6">
        {activities.map((item, index) => {
          const Icon = item.icon;

          return (
            <div key={index}>
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-${item.color}-50 text-${item.color}-600`}
                >
                  <Icon size={20} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-${item.color}-600">
                    {item.time}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{item.text}</p>
                </div>
              </div>

              {/* Divider */}
              {index !== activities.length - 1 && (
                <div className="mt-6 border-t border-slate-200" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6">
        <button className="text-sm font-medium text-indigo-600 hover:underline">
          View more
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
