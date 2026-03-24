import { useState } from "react";
import { X } from "lucide-react";

/**
 * Simplified UserModal for Managers/Seniors to manage their subordinates.
 * Focuses on Employee Track details.
 */
const UserModal = ({ title, user, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "employee",
    userType: user?.userType || "employee",
    departmentId: user?.departmentId || "",
    password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
            <input
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. John Smith"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input
              required
              type="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Track</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                value={form.userType}
                onChange={(e) => setForm({ ...form, userType: e.target.value })}
              >
                <option value="employee">Employee</option>
                <option value="intern">Intern</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="employee">Employee</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={user ? "Leave blank to keep current" : "Min 8 characters"}
              minLength={8}
              required={!user}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200 active:scale-95"
          >
            {user ? "Update Member" : "Add to Team"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
