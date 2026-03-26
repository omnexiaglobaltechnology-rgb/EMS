import { useEffect, useState } from "react";
import { Shield, Save, CheckCircle2, AlertCircle, Loader2, Users, Globe } from "lucide-react";
import { meetingsApi } from "../utils/api";

/**
 * Admin interface for managing meeting permissions across the organization.
 */
const AdminMeetingPermissions = () => {
  const [config, setConfig] = useState({
    allowedRoles: [],
    canInviteAcrossDepartments: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const roles = [
    { id: "ceo", label: "CEO" },
    { id: "cto", label: "CTO" },
    { id: "cfo", label: "CFO" },
    { id: "coo", label: "COO" },
    { id: "manager", label: "Managers" },
    { id: "manager_intern", label: "Manager Interns" },
    { id: "team_lead", label: "Team Leads" },
    { id: "team_lead_intern", label: "TL Interns" },
    { id: "intern", label: "Interns / Employees" }
  ];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await meetingsApi.getConfig();
      setConfig(data);
    } catch (err) {
      setError("Failed to load permissions config");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = (roleId, section) => {
    setConfig(prev => {
      const current = prev[section];
      const updated = current.includes(roleId)
        ? current.filter(r => r !== roleId)
        : [...current, roleId];
      return { ...prev, [section]: updated };
    });
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await meetingsApi.updateConfig(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meeting Permissions</h1>
        <p className="text-slate-500">Define which roles can schedule meetings and invite participants from other departments.</p>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{success ? "Permissions updated successfully!" : error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Creation Rights */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <Users size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Creation Rights</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
            Specify which roles are authorized to schedule new meetings within the system.
          </p>
          <div className="space-y-2">
            {roles.map(role => (
              <label key={role.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                <span className="text-sm font-semibold text-slate-700">{role.label}</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={config.allowedRoles.includes(role.id)}
                  onChange={() => handleToggleRole(role.id, "allowedRoles")}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Visibility Rights */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
              <Globe size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Cross-Dept Invitation</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
            Allow roles to search and invite employees outside of their primary assigned department.
          </p>
          <div className="space-y-2">
            {roles.map(role => (
              <label key={role.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                <span className="text-sm font-semibold text-slate-700">{role.label}</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={config.canInviteAcrossDepartments.includes(role.id)}
                  onChange={() => handleToggleRole(role.id, "canInviteAcrossDepartments")}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 text-white font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={20} />}
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AdminMeetingPermissions;
