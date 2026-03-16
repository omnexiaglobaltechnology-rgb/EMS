import { useState, useEffect } from "react";
import { departmentsApi, usersApi } from "../utils/api";

const ROLE_OPTIONS = [
  "intern",
  "employee",
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

const USER_TYPE_OPTIONS = ["employee", "intern"];

/**
 * UserModal component with hierarchy support.
 * Cascading selectors for User Type -> Department -> Manager -> Team Leader.
 */
const UserModal = ({ title, user, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    username: user.username || "",
    role: user.role || "intern",
    userType: user.userType || "employee",
    departmentId: user.departmentId || "",
    reportsTo: user.reportsTo || "",
    password: "",
  });

  const [departments, setDepartments] = useState([]);
  const [reportsToOptions, setReportsToOptions] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingReportsTo, setLoadingReportsTo] = useState(false);

  const isNewUser = !user.id;

  // Fetch departments when userType changes
  useEffect(() => {
    const fetchDepts = async () => {
      setLoadingDepts(true);
      try {
        const data = await departmentsApi.getAll(form.userType);
        setDepartments(data);
        // Clear department if it doesn't match new type
        if (!data.find(d => d.id === form.departmentId || d._id === form.departmentId)) {
          setForm(prev => ({ ...prev, departmentId: "" }));
        }
      } catch (err) {
        console.error("Failed to fetch departments:", err);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, [form.userType]);

  // Fetch potential supervisors when role or department changes
  useEffect(() => {
    const fetchSupervisors = async () => {
      if (!form.departmentId) {
        setReportsToOptions([]);
        return;
      }

      setLoadingReportsTo(true);
      try {
        let filterRole = "";
        
        // Determine who this user should report to based on role
        if (["intern", "employee"].includes(form.role)) {
          filterRole = form.userType === "intern" ? "team_lead_intern" : "team_lead";
        } else if (["team_lead", "team_lead_intern"].includes(form.role)) {
          filterRole = form.userType === "intern" ? "manager_intern" : "manager";
        } else if (["cto", "cfo", "coo", "manager", "manager_intern"].includes(form.role)) {
          // Managers and CXOs report to CEO
          filterRole = "ceo";
        }

        const query = { role: filterRole };
        // Only filter by department if not looking for CEO (who is global)
        if (filterRole !== "ceo" && form.departmentId) {
          query.departmentId = form.departmentId;
        }

        const data = await usersApi.getAll(query);
        setReportsToOptions(data);
      } catch (err) {
        console.error("Failed to fetch supervisors:", err);
      } finally {
        setLoadingReportsTo(false);
      }
    };
    fetchSupervisors();
  }, [form.role, form.departmentId, form.userType]);

  const handleSubmit = () => {
    // Username is now optional
    if (!form.name || !form.email) return;
    if (isNewUser && !form.password) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-lg rounded-[3rem] glass-dark p-10 space-y-8 max-h-[90vh] overflow-y-auto border border-white/30 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
          {title.split(' ')[0]} <span className="text-[#00d4ff] blue-glow">{title.split(' ').slice(1).join(' ')}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name */}
          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 group-focus-within:text-[#00d4ff] transition-colors">Full Name</label>
            <input
              className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all shadow-inner"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          {/* Username */}
          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 group-focus-within:text-[#00d4ff] transition-colors">Username / ID</label>
            <input
              className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all shadow-inner"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="EMP001"
            />
          </div>

          {/* Email */}
          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 group-focus-within:text-[#00d4ff] transition-colors">Email Address</label>
            <input
              className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all shadow-inner"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@omnexia.in"
            />
          </div>

          {/* Password (only for new users) */}
          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 group-focus-within:text-[#00d4ff] transition-colors">
              {isNewUser ? "Secure Key" : "Reset Key"}
            </label>
            <input
              type="password"
              className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all shadow-inner"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••••••"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* User Type */}
          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 group-focus-within:text-[#00d4ff] transition-colors">User Track</label>
            <select
              className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white capitalize focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all appearance-none shadow-inner"
              value={form.userType}
              onChange={(e) => setForm({ ...form, userType: e.target.value })}
            >
              {USER_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t} className="bg-slate-900">{t}</option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 group-focus-within:text-[#00d4ff] transition-colors">Role</label>
            <select
              className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white capitalize focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all appearance-none shadow-inner"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r} className="bg-slate-900">
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Department */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">
              Department {loadingDepts && "..."}
            </label>
            <select
              className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all appearance-none disabled:opacity-30 shadow-inner"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              disabled={loadingDepts || form.role === 'ceo'}
            >
              <option value="" className="bg-slate-900">{form.role === 'ceo' ? "None" : "Select Dept"}</option>
              {departments.map((d) => (
                <option key={d.id || d._id} value={d.id || d._id} className="bg-slate-900">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reports To */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">
              Reports To {loadingReportsTo && "..."}
            </label>
            <select
              className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all appearance-none disabled:opacity-30 shadow-inner"
              value={form.reportsTo}
              onChange={(e) => setForm({ ...form, reportsTo: e.target.value })}
              disabled={loadingReportsTo || form.role === 'ceo' || (!form.departmentId && !['cto', 'cfo', 'coo', 'manager', 'manager_intern'].includes(form.role))}
            >
              <option value="" className="bg-slate-900">{form.role === 'ceo' ? "CEO (Top)" : "Select Supervisor"}</option>
              {reportsToOptions.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id} className="bg-slate-900">
                  {u.name} ({u.role.replace(/_/g, " ")})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            onClick={onClose}
            className="rounded-xl px-6 py-3 text-sm font-bold text-white/70 hover:text-white hover:bg-white/30 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-2xl blue-button px-10 py-4 text-xs font-black uppercase tracking-[0.2em] active:scale-95"
          >
            {isNewUser ? "Initialize User" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
