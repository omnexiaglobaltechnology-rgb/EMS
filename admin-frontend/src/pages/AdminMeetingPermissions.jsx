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
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Meeting Permissions</h1>
        <p className="text-white/60 font-medium">Define which roles can schedule meetings and invite participants from other departments.</p>
      </div>

      {(error || success) && (
        <div className={`p-5 rounded-2xl border backdrop-blur-md flex items-center gap-4 animate-in fade-in slide-in-from-top-2 ${
          success ? "bg-emerald-500/30 border-emerald-500/30 text-emerald-400" : "bg-red-500/30 border-red-500/30 text-red-400"
        }`}>
          {success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <p className="text-sm font-bold uppercase tracking-wider">{success ? "Configuration secured" : error}</p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Creation Rights */}
        <div className="card-glass p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/30 p-4 rounded-3xl text-[#00fbff] border border-white/30 shadow-[0_0_20px_rgba(0,251,255,0.2)] cyan-glow">
              <Users size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Creation <span className="text-[#00fbff] cyan-glow">Rights</span></h2>
          </div>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest leading-relaxed">
            Authorized roles for scheduling
          </p>
          <div className="space-y-3">
            {roles.map(role => (
              <label key={role.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/30 bg-white/30 hover:bg-white/40 hover:border-white/50 transition-all cursor-pointer group">
                <span className="text-xs font-black text-white/80 uppercase tracking-widest group-hover:text-[#00fbff] transition-all duration-500">{role.label}</span>
                <input
                  type="checkbox"
                  className="w-6 h-6 rounded-xl border border-white/30 bg-white/30 text-[#00fbff] focus:ring-offset-0 focus:ring-2 focus:ring-[#00fbff] cursor-pointer transition-all shadow-inner"
                  checked={config.allowedRoles.includes(role.id)}
                  onChange={() => handleToggleRole(role.id, "allowedRoles")}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Visibility Rights */}
        <div className="card-glass p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/30 p-3 rounded-2xl text-amber-400 border border-white/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Globe size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Cross-Dept</h2>
          </div>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest leading-relaxed">
            Invitation reach permissions
          </p>
          <div className="space-y-3">
            {roles.map(role => (
              <label key={role.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/30 bg-white/30 hover:bg-white/40 hover:border-white/50 transition-all cursor-pointer group">
                <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{role.label}</span>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-lg border-white/30 bg-white/30 text-[#00fbff] focus:ring-offset-0 focus:ring-2 focus:ring-[#00fbff] cursor-pointer transition-all shadow-inner"
                  checked={config.canInviteAcrossDepartments.includes(role.id)}
                  onChange={() => handleToggleRole(role.id, "canInviteAcrossDepartments")}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-4 rounded-2xl cyan-button px-12 py-5 font-black uppercase tracking-[0.2em] text-xs active:scale-95 disabled:opacity-50 shadow-2xl"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin text-[#00fbff]" /> : <Save size={20} strokeWidth={3} />}
          {saving ? "Synchronizing..." : "Authorize Permissions"}
        </button>
      </div>
    </div>
  );
};

export default AdminMeetingPermissions;
