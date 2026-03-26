import { useNavigate } from "react-router-dom";

const statusStyles = {
  Scheduled: "bg-blue-100 text-blue-600",
  Ongoing: "bg-green-100 text-green-600",
};

/**
 * Component displaying details of an upcoming or ongoing meeting within the manager dashboard.
 * Includes status badging and a button to start or join the meeting.
 *
 * @param {object} meeting - The meeting data object
 */
const MeetingCard = ({ meeting }) => {
  const navigate = useNavigate();

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
        onClick={() => navigate(`/manager/meeting-room/${meeting.id}`)}
        className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm"
      >
        {meeting.status === "Scheduled" ? "Start" : "Join"}
      </button>
    </div>
  );
};

export default MeetingCard;
