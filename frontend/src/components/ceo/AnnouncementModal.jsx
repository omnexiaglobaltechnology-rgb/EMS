import { useState } from "react";

import { X } from "lucide-react";

/**
 * Component for creating and editing announcements within the CEO dashboard.
 * Provides a form containing title, date, and description fields.
 *
 * @param {string} mode - Determines if the modal is for creating ("new") or editing ("edit")
 * @param {object} data - The initial announcement data to prepopulate the form
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSave - Callback receiving the submitted form data
 */
const AnnouncementModal = ({ mode, data, onClose, onSave }) => {
  const [form, setForm] = useState(
    data || { title: "", date: "", description: "" },
  );

  /**
   * Submit handler for the announcement form.
   * Validates that all fields are filled before triggering onSave.
   */
  const handleSubmit = () => {
    if (!form.title || !form.date || !form.description) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {mode === "edit" ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button className="cursor-pointer" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 cursor-pointer hover:bg-slate-50 px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-indigo-600 px-4 py-2 text-white"
          >
            {mode === "edit" ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
