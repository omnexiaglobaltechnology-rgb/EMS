import { useState, useEffect } from "react";
import { X, Loader, Activity } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-lg glass-dark rounded-[2.5rem] border border-white/20 shadow-2xl p-10 space-y-8 relative animate-in zoom-in-95 duration-500">
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-white/40 hover:text-[#00d4ff] hover:rotate-90 transition-all duration-300"
        >
          <X size={24} />
        </button>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{title}</h2>
          <div className="h-1 w-12 bg-[#00d4ff] rounded-full blue-glow"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Full Name</label>
            <input
              required
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-[#00d4ff]/50 focus:bg-white/[0.08] outline-none transition-all duration-300"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="E.g. JASON BOURNE"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Email Terminal</label>
            <input
              required
              type="email"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-[#00d4ff]/50 focus:bg-white/[0.08] outline-none transition-all duration-300"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="IDENTIFIER@EMS.NET"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Track</label>
              <div className="relative">
                <select
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-sm text-white focus:border-[#00d4ff]/50 outline-none transition-all duration-300 appearance-none cursor-pointer"
                  value={form.userType}
                  onChange={(e) => setForm({ ...form, userType: e.target.value })}
                >
                  <option value="employee" className="bg-[#0f172a]">Employee</option>
                  <option value="intern" className="bg-[#0f172a]">Intern</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                  <Activity size={12} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Role</label>
              <div className="relative">
                <select
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-sm text-white focus:border-[#00d4ff]/50 outline-none transition-all duration-300 appearance-none cursor-pointer"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="employee" className="bg-[#0f172a]">Employee</option>
                  <option value="intern" className="bg-[#0f172a]">Intern</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                  <Activity size={12} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Sec-Key</label>
            <input
              type="password"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-[#00d4ff]/50 focus:bg-white/[0.08] outline-none transition-all duration-300"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={user ? "ENCRYPTED - LEAVE BLANK" : "MIN 8 CHARACTERS"}
              minLength={8}
              required={!user}
            />
          </div>

          <button
            type="submit"
            className="w-full blue-button rounded-2xl py-5 text-xs uppercase tracking-[0.3em] active:scale-[0.98]"
          >
            {user ? "Commit Changes" : "Initialize Member"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
