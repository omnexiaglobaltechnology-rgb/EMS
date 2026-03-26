import MeetingStatusBadge from "./MeetingStatusBadge";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Card displaying essential details of an upcoming or scheduled meeting.
 * Used within team lead dashboard areas. Supports starting or joining a meeting room.
 *
 * @param {object} meeting - The meeting object containing title, datetime, participants, and status
 * @param {boolean} [joinOnly=false] - If true, the button is forced to say "Join" rather than conditional "Start/Join"
 */
const MeetingCard = ({ meeting, joinOnly = false }) => {
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth?.role);

  const handleJoin = () => {
    if (role === "team_lead_intern") {
      navigate(`/team_lead_intern/tl-meeting-room/${meeting.id}`);
    } else {
      navigate(`/team_lead/tl-meeting-room/${meeting.id}`);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <h3 className="font-medium text-slate-900">{meeting.title}</h3>

      <p className="text-sm text-slate-600">
        <strong>Date & Time:</strong> {meeting.datetime}
      </p>

      <p className="text-sm text-slate-600">
        <strong>Participants:</strong> {meeting.participants.join(", ")}
      </p>

      <div className="flex items-center justify-between pt-2">
        <MeetingStatusBadge value={meeting.status} />

        <button
          onClick={handleJoin}
          className="rounded bg-indigo-600 px-4 py-1.5 text-sm text-white hover:bg-indigo-700"
        >
          {joinOnly ? "Join" : "Start"}
        </button>
      </div>
    </div>
  );
};

export default MeetingCard;
