import { useEffect, useState } from "react";
import MeetingRow from "../../components/intern/MeetingRow";
import {
  getMeetingsByCreators,
  getMeetingsForRole,
} from "../../utils/meetingsStore";

/**
 * Meeting overview page for interns.
 * Consolidates meetings scheduled by Team Leads and Managers.
 */
const InternMeetings = () => {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const leadMeetings = getMeetingsByCreators([
      "team_lead",
      "team_lead_intern",
    ]);
    const managerMeetings = getMeetingsForRole("intern", ["manager"]);
    setMeetings([...leadMeetings, ...managerMeetings]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Meetings</h1>
        <p className="mt-1 text-slate-500">
          View and join your upcoming meetings
        </p>
      </div>

      {/* Meetings Card */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-medium text-slate-900">Upcoming Meetings</h2>
        </div>

        <div className="divide-y divide-gray-300">
          {meetings.length > 0 ? (
            meetings.map((meeting) => (
              <MeetingRow key={meeting.id} meeting={meeting} />
            ))
          ) : (
            <div className="p-5 text-sm text-slate-500">
              No meetings available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternMeetings;
