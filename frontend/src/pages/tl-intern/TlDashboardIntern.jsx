import {
  Users,
  ClipboardCheck,
  FileClock,
  Calendar,
  CheckSquare,
  FileText,
} from "lucide-react";

import ActivityRow from "../../components/tl-panel/ActivityRow";
import StatCard from "../../components/tl-panel/StatCard";

const stats = [
  {
    title: "Total Interns",
    value: 12,
    subtitle: "Currently managing",
    icon: Users,
  },
  {
    title: "Active Tasks",
    value: 45,
    subtitle: "Tasks in progress",
    icon: ClipboardCheck,
  },
  {
    title: "Pending Reviews",
    value: "08",
    subtitle: "Awaiting your review",
    icon: FileClock,
  },
  {
    title: "Upcoming Meetings",
    value: "03",
    subtitle: "Scheduled for today",
    icon: Calendar,
  },
];

/* ---------------- RECENT ACTIVITY ---------------- */

const activities = [
  {
    id: 1,
    time: "10:30 AM",
    text: "Intern 'John Smith' updated task 'Project Research' to In Progress",
    icon: CheckSquare,
  },
  {
    id: 2,
    time: "11:15 AM",
    text: "Submission 'Q4 Report Draft' by 'Emily Chen' is ready for review",
    icon: FileText,
  },
  {
    id: 3,
    time: "12:00 PM",
    text: "Meeting 'Weekly Sync' with interns scheduled for 2:00 PM",
    icon: Calendar,
  },
];

/**
 * Dashboard for Team Lead Interns.
 * Displays managed interns count, active tasks, pending reviews, and recent activity.
 */
const TlDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Team Lead Dashboard
        </h1>
        <p className="mt-1 text-slate-500">
          Overview of interns, tasks, and reviews
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-medium text-slate-900">Recent Activity</h2>
        </div>

        <div className="divide-y">
          {activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TlDashboard;
