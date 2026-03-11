import { useState } from "react";

const ROLE_OPTIONS = [
  "intern",
  "team_lead",
  "team_lead_intern",
  "manager",
  "manager_intern",
  "admin",
  "cto",
  "cfo",
  "coo",
  "ceo",
];
const STATUS_OPTIONS = ["active", "inactive"];

/**
 * UserModal component provides a form interface for administrators to create
 * or edit a user's basic information such as name, email, role, and status.
 */
const UserModal = ({ title, user, onClose, onSave }) => {
  // Local state to track form inputs
  const [form, setForm] = useState({
    ...user,
    password: "", // Add password field for new user creation
  });

  const isNewUser = !user.id;

  /**
   * Handles the form submission verifying required fields before saving.
   */
  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    if (isNewUser && !form.password) return;
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Doe"
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="john@owms.com"
          />
        </div>

        {/* Password (only for new users) */}
        {isNewUser && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Initial Password</label>
            <input
              type="password"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 8 chars, letter & number"
            />
          </div>
        )}

        {/* Role */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Role</label>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm capitalize"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 font-medium text-sm">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Save User
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
