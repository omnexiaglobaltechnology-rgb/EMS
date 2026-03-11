import { useEffect, useState } from "react";
import MeetingsCard from "../../components/manager_intern/MeetingsCard";
import CreateMeetingsModal from "../../components/manager_intern/CreateMeetingsModal";
import { getMeetingsForRole } from "../../utils/meetingsStore";

/**
 * Meeting overview and scheduling page for manager-interns.
 */
const Manager_internMeetings = () => {
  const [showModal, setShowModal] = useState(false);

  const [myMeetings, setMyMeetings] = useState([
    {
      id: "meeting-121",
      title: "Weekly Sync - Interns Group A",
      datetime: "Mon, Dec 29, 2025 at 10:00 AM",
      participants: ["John S.", "Sarah L.", "Emily C."],
      status: "Scheduled",
    },
    {
      id: "meeting-122",
      title: "1-on-1 with David Lee",
      datetime: "Mon, Dec 29, 2025 at 1:30 PM",
      participants: ["David Lee"],
      status: "Ongoing",
    },
  ]);

  const [managerMeetings, setManagerMeetings] = useState([]);

  useEffect(() => {
    setManagerMeetings(getMeetingsForRole("manager_intern", ["manager"]));
  }, []);

  /**
   * Appends a newly created meeting to the local state.
   *
   * @param {object} newMeeting - Meeting details
   */
  const handleCreateMeeting = (newMeeting) => {
    setMyMeetings((prev) => [newMeeting, ...prev]);
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
            <MeetingsCard key={i} meeting={m} />
          ))}
        </div>
      </section>

      {/* Scheduled by Manager */}
      <section className="space-y-4">
        <h2 className="font-medium text-lg">Meetings Scheduled by Manager</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {managerMeetings.length > 0 ? (
            managerMeetings.map((m) => <MeetingsCard key={m.id} meeting={m} />)
          ) : (
            <p className="text-sm text-slate-500">
              No meetings scheduled by Manager.
            </p>
          )}
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <CreateMeetingsModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateMeeting}
        />
      )}
    </div>
  );
};

export default Manager_internMeetings;
