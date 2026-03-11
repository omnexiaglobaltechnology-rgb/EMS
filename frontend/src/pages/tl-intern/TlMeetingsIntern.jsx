import { useEffect, useState } from "react";

import { Plus } from "lucide-react";

import MeetingCard from "../../components/tl-panel/MeetingCard";
import Section from "../../components/tl-panel/Section";
import CreateMeetingModal from "../../components/tl-panel/CreateMeetingModal";
import {
  addMeetingToStore,
  getMeetingsByCreator,
  getMeetingsForRole,
} from "../../utils/meetingsStore";

/**
 * Meetings management for TL Interns.
 * Tracks meetings created personally and those scheduled by higher management.
 */
const TlMeetings = () => {
  const [myMeetings, setMyMeetings] = useState([]);
  const [managerMeetings, setManagerMeetings] = useState([]);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMyMeetings(getMeetingsByCreator("team_lead_intern"));
    setManagerMeetings(getMeetingsForRole("team_lead_intern", ["manager"]));
  }, []);

  /**
   * Schedules a new meeting and adds it to the local store.
   *
   * @param {object} meeting - Meeting configuration
   */
  const addMeeting = (meeting) => {
    const createdMeeting = addMeetingToStore(meeting, "team_lead_intern");
    setMyMeetings((prev) => [...prev, createdMeeting]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Meetings</h1>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} />
          Create Meeting
        </button>
      </div>

      {/* Meetings Created by Me */}
      <Section title="Meetings Created by Me">
        {myMeetings.map((m) => (
          <MeetingCard key={m.id} meeting={m} />
        ))}
      </Section>

      {/* Meetings Scheduled by Manager */}
      <Section title="Meetings Scheduled by Manager">
        {managerMeetings.length > 0 ? (
          managerMeetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} joinOnly />
          ))
        ) : (
          <p className="text-sm text-slate-500">
            No meetings scheduled by Manager.
          </p>
        )}
      </Section>

      {open && (
        <CreateMeetingModal
          onClose={() => setOpen(false)}
          onCreate={addMeeting}
        />
      )}
    </div>
  );
};

export default TlMeetings;
