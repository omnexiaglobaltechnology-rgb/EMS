import { useState, useEffect } from "react";
import { departmentsApi, usersApi } from "../utils/api";

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
        } else if (["manager", "manager_intern"].includes(form.role)) {
          // Managers report to CTO/CFO/COO or CEO
          filterRole = ""; // Admin can select any higher role
        }

        const data = await usersApi.getAll({
          departmentId: form.departmentId,
          role: filterRole,
        });
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
    if (!form.name || !form.email || !form.username) return;
    if (isNewUser && !form.password) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Username / Unique ID</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="EMP001 or johndoe"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email Address</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@owms.com"
            />
          </div>

          {/* Password (only for new users) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              {isNewUser ? "Initial Password" : "Reset Password (optional)"}
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 8 chars"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">User Track</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize focus:ring-2 focus:ring-indigo-500"
              value={form.userType}
              onChange={(e) => setForm({ ...form, userType: e.target.value })}
            >
              {USER_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize focus:ring-2 focus:ring-indigo-500"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Department */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Department {loadingDepts && "(Loading...)"}
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              disabled={loadingDepts}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id || d._id} value={d.id || d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reports To */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Reports To {loadingReportsTo && "(Loading...)"}
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={form.reportsTo}
              onChange={(e) => setForm({ ...form, reportsTo: e.target.value })}
              disabled={loadingReportsTo || !form.departmentId}
            >
              <option value="">Select Supervisor (Optional)</option>
              {reportsToOptions.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id}>
                  {u.name} ({u.role.replace(/_/g, " ")})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 font-medium text-sm">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {isNewUser ? "Create User" : "Update User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
