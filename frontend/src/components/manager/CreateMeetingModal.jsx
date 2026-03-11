import { useState } from "react";

const recipients = [
  { id: 1, role: "team_lead", name: "Team Lead" },
  { id: 2, role: "team_lead_intern", name: "Team Lead Intern" },
  { id: 3, role: "manager_intern", name: "Manager Intern" },
  { id: 4, role: "intern", name: "Intern" },
];

/**
 * Modal component allowing managers to schedule a new meeting.
 * Includes fields for title, target roles, date, time, and description.
 *
 * @param {function} onClose - Callback invoked to close the modal
 * @param {function} onCreate - Callback invoked with the structure of the new meeting
 */
const CreateMeetingModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    title: "",
    targetRoles: [],
    date: "",
    time: "",
    description: "",
  });

  /**
   * Toggles the selection state of a particular target role for the meeting.
   * @param {string} role - The role identifier to toggle
   */
  const toggleRecipient = (role) => {
    setForm((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((item) => item !== role)
        : [...prev.targetRoles, role],
    }));
  };

  /**
   * Converts a 24-hour time string into a 12-hour AM/PM format.
   * @param {string} time24 - Time string in HH:mm format
   * @returns {string} Formatted 12-hour string (e.g., "02:30 PM")
   */
  const formatTime12 = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${m} ${ampm}`;
  };

  /**
   * Validates the form data and triggers the `onCreate` callback if required fields are provided.
   */
  const handleCreate = () => {
    if (
      !form.title ||
      !form.date ||
      !form.time ||
      form.targetRoles.length === 0
    ) {
      return;
    }

    const participantNames = recipients
      .filter((recipient) => form.targetRoles.includes(recipient.role))
      .map((recipient) => recipient.name);

    onCreate({
      id: Date.now(),
      title: form.title,
      datetime: `${form.date} at ${formatTime12(form.time)}`,
      participants: participantNames,
      status: "Scheduled",
      date: form.date,
      time: formatTime12(form.time),
      duration: "30 min",
      platform: "EMS Meet",
      link: "#",
      description: form.description,
      targetRoles: form.targetRoles,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Create New Meeting</h2>

        <input
          placeholder="Meeting Title"
          className="w-full rounded border px-3 py-2"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        {/* Select Recipients */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Select Target Panels</p>
          <div className="flex flex-wrap gap-2">
            {recipients.map((recipient) => (
              <button
                key={recipient.id}
                type="button"
                onClick={() => toggleRecipient(recipient.role)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  form.targetRoles.includes(recipient.role)
                    ? "bg-indigo-100 border-indigo-500 text-indigo-600"
                    : "border-slate-300"
                }`}
              >
                {recipient.name}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            className="rounded border px-3 py-2"
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <input
            type="time"
            className="rounded border px-3 py-2"
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
        </div>

        <textarea
          placeholder="Description (optional)"
          rows={3}
          className="w-full rounded border px-3 py-2"
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="rounded border px-4 py-2">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="rounded bg-indigo-600 px-4 py-2 text-white"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMeetingModal;
