import { useState } from "react";
import { Plus, Calendar, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const initialMeetings = [
  {
    id: 1,
    title: "Architecture Review Board",
    datetime: "Mon, Feb 16, 2026 at 10:00 AM",
    participants: "Tech Leads, Architects, CTO",
    status: "Scheduled",
  },
  {
    id: 2,
    title: "Weekly Engineering Sync",
    datetime: "Wed, Feb 18, 2026 at 11:00 AM",
    participants: "Engineering Mngrs, CTO",
    status: "Scheduled",
  },
  {
    id: 3,
    title: "Q1 Tech Roadmap Planning",
    datetime: "Fri, Feb 20, 2026 at 02:00 PM",
    participants: "Product Heads, CTO, CEO",
    status: "Scheduled",
  },
];

/**
 * Engineering meet-up and technical sync coordination interface for the CTO.
 * Manages upcoming technical engagements and provisions a interface for scheduling new sessions.
 */
const CtoMeetings = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState(initialMeetings);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    participants: "",
    description: "",
  });

  /**
   * Helper utility to normalize raw 24-hour time strings into human-readable
   * 12-hour AM/PM representations.
   *
   * @param {string} time - Time string in HH:MM format
   * @returns {string} Formatted time string
   */
  const formatTime = (time) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${m} ${ampm}`;
  };

  /**
   * Serializes modal form inputs into a new meeting object and persists it
   * to the localized session state.
   */
  const handleCreate = () => {
    if (!form.title || !form.date || !form.time) return;

    const newMeeting = {
      id: Date.now(),
      title: form.title,
      datetime: `${new Date(form.date).toDateString()} at ${formatTime(
        form.time,
      )}`,
      participants: form.participants || "Engineering Staff",
      status: "Scheduled",
    };

    setMeetings([newMeeting, ...meetings]);
    setOpen(false);
    setForm({
      title: "",
      date: "",
      time: "",
      participants: "",
      description: "",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Technical Meetings
          </h1>
          <p className="text-sm text-slate-500">
            Coordinate and schedule engineering syncs
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Schedule Tech Sync
        </button>
      </div>

      {/* Meetings List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meetings.map((m) => (
          <div
            key={m.id}
            className="flex flex-col rounded-xl border border-gray-300 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 h-14 line-clamp-2">
                {m.title}
              </h3>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-500" />{" "}
                  {m.datetime}
                </p>
                <p className="flex items-center gap-2">
                  <Users size={16} className="text-indigo-500" />{" "}
                  {m.participants}
                </p>
              </div>
            </div>

            {/* ALIGNMENT FIX: items-center ensures both components stay on the same horizontal line */}
            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 h-7">
                {m.status}
              </span>

              <button
                onClick={() => navigate(`/cto/cto-meeting-room/${m.id}`)}
                className="rounded-md border border-indigo-600 px-4 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors h-9"
              >
                Join
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-800">
                Schedule Technical Meeting
              </h2>
              <button
                className="cursor-pointer text-slate-400 hover:text-slate-600"
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Subject
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Time
                  </label>
                  <input
                    type="time"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Participants
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none"
                  value={form.participants}
                  onChange={(e) =>
                    setForm({ ...form, participants: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-white font-semibold shadow-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CtoMeetings;
