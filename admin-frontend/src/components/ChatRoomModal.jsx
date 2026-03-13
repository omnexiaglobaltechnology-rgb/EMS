import { useState, useEffect } from "react";
import { departmentsApi, chatApi } from "../utils/api";

const ROOM_TYPES = ["tech_support", "announcement", "department"];

const ChatRoomModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    name: "",
    type: "department",
    departmentId: "",
    emails: "", // Comma-separated
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await departmentsApi.getAll();
        setDepartments(data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.departmentId) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        emails: form.emails.split(",").map(e => e.trim()).filter(e => e),
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-900">Create Chat Room</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Room Name</label>
            <input
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Project Alpha Discussion"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Type</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {ROOM_TYPES.map(t => (
                <option key={t} value={t}>{t.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Department</label>
            <select
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d.id || d._id} value={d.id || d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Participant Emails (Comma separated)</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
              value={form.emails}
              onChange={(e) => setForm({ ...form, emails: e.target.value })}
              placeholder="user1@gmail.com, user2@omnexiatechnology.in"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoomModal;
