import { useState } from "react";

const ROLE_OPTIONS = ["INTERN", "TL", "MANAGER", "CRO", "CEO", "ADMIN"];
const STATUS_OPTIONS = ["active", "inactive"];

/**
 * UserModal component provides a form interface for administrators to create
 * or edit a user's basic information such as name, email, role, and status.
 *
 * @param {string} title - The title of the modal (e.g., "Add User" or "Edit User")
 * @param {object} user - The initial user data to populate the form
 * @param {function} onClose - Callback to close the modal without saving
 * @param {function} onSave - Callback triggered with the form data when saved
 */
const UserModal = ({ title, user, onClose, onSave }) => {
  // Local state to track form inputs
  const [form, setForm] = useState(user);

  /**
   * Handles the form submission verifying required fields before saving.
   */
  const handleSubmit = () => {
    if (!form.name || !form.email) return; // Prevent saving if required fields are empty
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">{title}</h2>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Full Name</label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* Role */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Role</label>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-indigo-600 px-4 py-2 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
