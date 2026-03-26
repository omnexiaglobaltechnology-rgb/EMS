import { Video, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Link } from "react-router-dom";

/**
 * Component displaying details of an upcoming or past meeting for an intern.
 * Includes a quick access button to join the meeting room.
 *
 * @param {object} meeting - The meeting details (title, date, time, duration, platform, id)
 */
const MeetingRow = ({ meeting }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-5">
      {/* Left */}
      <div className="space-y-1">
        <p className="font-medium text-slate-900">{meeting.title}</p>

        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {meeting.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {meeting.time} ({meeting.duration})
          </span>
        </div>

        <p className="text-sm text-slate-500">Platform: {meeting.platform}</p>
      </div>

      {/* Right */}
      <Link
        href={meeting.link}
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
      >
        <Video size={16} />
        <button
          onClick={() => navigate(`/intern/intern-meeting-room/${meeting.id}`)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm"
        >
          Join
        </button>
      </Link>
    </div>
  );
};

export default MeetingRow;
