import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const statusStyles = {
  Scheduled: "bg-blue-100 text-blue-600",
  Ongoing: "bg-green-100 text-green-600",
};

/**
 * Component displaying details of an upcoming or ongoing meeting within the manager intern dashboard.
 * Supports conditional navigation based on the user's role.
 *
 * @param {object} meeting - The meeting data object
 */
const MeetingsCard = ({ meeting }) => {
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth?.role);

  const handleJoin = () => {
    if (role === "manager_intern") {
      navigate(`/manager_intern/meeting-room/${meeting.id}`);
    } else {
      navigate(`/manager/meeting-room/${meeting.id}`);
    }
  };

  return (
    <div className="rounded-xl border border-gray-300 bg-white p-5 flex justify-between items-end">
      <div className="space-y-1">
        <h3 className="font-semibold">{meeting.title}</h3>

        <p className="text-sm text-slate-600">
          <span className="font-medium">Date & Time:</span> {meeting.datetime}
        </p>

        <p className="text-sm text-slate-600">
          <span className="font-medium">Participants:</span>{" "}
          {meeting.participants.join(", ") || "—"}
        </p>

        <span
          className={`inline-block mt-2 rounded-full px-3 py-1 text-xs font-medium ${
            statusStyles[meeting.status]
          }`}
        >
          {meeting.status}
        </span>
      </div>

      <button
        onClick={handleJoin}
        className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm"
      >
        Join
      </button>
    </div>
  );
};

export default MeetingsCard;
