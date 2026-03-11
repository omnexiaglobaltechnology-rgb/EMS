import { useEffect, useState } from "react";
import MeetingCard from "../../components/manager/MeetingCard";
import CreateMeetingModal from "../../components/manager/CreateMeetingModal";
import {
  addMeetingToStore,
  getMeetingsByCreator,
} from "../../utils/meetingsStore";

/**
 * Meeting coordination page for managers.
 * Handles the creation and tracking of departmental syncs.
 */
const Meetings = () => {
  const [showModal, setShowModal] = useState(false);
  const [myMeetings, setMyMeetings] = useState([]);

  useEffect(() => {
    setMyMeetings(getMeetingsByCreator("manager"));
  }, []);

  /**
   * Persists new meeting schedules to the central store.
   *
   * @param {object} newMeeting - Meeting configuration object
   */
  const handleCreateMeeting = (newMeeting) => {
    const createdMeeting = addMeetingToStore(newMeeting, "manager");
    setMyMeetings((prev) => [createdMeeting, ...prev]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meetings</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white flex items-center gap-2"
        >
          + Create Meeting
        </button>
      </div>

      {/* Created by Me */}
      <section className="space-y-4">
        <h2 className="font-medium text-lg">Meetings Created by Me</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myMeetings.map((m, i) => (
            <MeetingCard key={i} meeting={m} />
          ))}
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <CreateMeetingModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateMeeting}
        />
      )}
    </div>
  );
};

export default Meetings;
