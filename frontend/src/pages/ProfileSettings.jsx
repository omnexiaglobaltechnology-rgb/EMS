import { useState, useEffect } from "react";
import { Mail, Shield, Save, CheckCircle, AlertCircle, Loader2, Lock, KeyRound } from "lucide-react";
import { useSelector } from "react-redux";
import { authApi } from "../utils/api";

/**
 * Profile Settings component allowing users to manage their personal information.
 * Specifically handles setting a personal Gmail address for meeting notifications.
 */
const ProfileSettings = () => {
  const auth = useSelector((state) => state.auth);
  const [personalEmail, setPersonalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (auth?.personalEmail) {
      setPersonalEmail(auth.personalEmail);
    } else {
      fetchProfile();
    }
  }, [auth]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authApi.me();
      if (data.personalEmail) {
        setPersonalEmail(data.personalEmail);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await authApi.updateProfile({ personalEmail });
      setMessage({ type: "success", text: "Profile updated successfully! You will now receive meeting notifications at this email." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);

  const handlePwChange = async (e) => {
    e.preventDefault();
    setPwMessage(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (pwForm.newPassword.length < 6) {
      setPwMessage({ type: "error", text: "Password must be at least 6 characters long" });
      return;
    }

    setPwSaving(true);
    try {
      await authApi.changePassword({ 
        currentPassword: pwForm.currentPassword, 
        newPassword: pwForm.newPassword 
      });
      setPwMessage({ type: "success", text: "Password updated successfully!" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwMessage({ type: "error", text: err.message || "Failed to update password" });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/10 border-t-[#00d4ff] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Loading Profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="glass-dark p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d4ff]/5 blur-[100px] rounded-full group-hover:bg-[#00d4ff]/10 transition-colors"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight">
            Account <span className="text-[#00d4ff] blue-glow">Settings</span>
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-1 w-12 bg-[#00d4ff] rounded-full blue-glow"></div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
              Configuration Panel
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div className={`flex items-center gap-3 p-5 rounded-2xl border ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        } animate-in fade-in slide-in-from-top-2`}>
          {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-xs font-bold">{message.text}</p>
        </div>
      )}

      {pwMessage && (
        <div className={`flex items-center gap-3 p-5 rounded-2xl border ${
          pwMessage.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        } animate-in fade-in slide-in-from-top-2`}>
          {pwMessage.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-xs font-bold">{pwMessage.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Left: User Card */}
        <div className="lg:col-span-1">
          <div className="card-glass text-center space-y-6">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-blue-600 flex items-center justify-center mx-auto text-white text-3xl font-black uppercase shadow-lg shadow-blue-500/20">
              {auth?.name?.substring(0, 2) || "UN"}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">{auth?.name}</h2>
              <p className="text-[10px] font-black text-[#00d4ff] uppercase tracking-[0.2em] mt-1 blue-glow">{auth?.role?.replace(/_/g, " ")}</p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-center gap-2 text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">
                <Shield size={14} className="text-[#00d4ff]" />
                <span>Verified Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Settings Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* EMAIL NOTIFICATIONS FORM */}
          <form onSubmit={handleSave} className="card-glass !p-0 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Email Notifications</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Configure alert destinations</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4 p-6 bg-[#00d4ff]/5 rounded-2xl border border-[#00d4ff]/10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#00d4ff]/10 rounded-xl border border-[#00d4ff]/20">
                    <Mail size={18} className="text-[#00d4ff] blue-glow" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-black text-white uppercase tracking-wider block mb-1">Personal Gmail Address</label>
                    <p className="text-[10px] text-white/30 font-bold leading-relaxed mb-4">
                      Add your personal Gmail to receive instant notifications for meeting schedules and assignments.
                    </p>
                    <input 
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-[#00d4ff]/50 focus:bg-white/[0.08] outline-none transition-all duration-300"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="blue-button rounded-2xl px-8 py-4 flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </form>

          {/* PASSWORD CHANGE FORM */}
          <form onSubmit={handlePwChange} className="card-glass !p-0 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Lock size={18} className="text-[#00d4ff]" />
                Password & Security
              </h3>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Update your access credentials</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Current Password</label>
                <input 
                  type="password"
                  required
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-[#00d4ff]/50 focus:bg-white/[0.08] outline-none transition-all duration-300"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({...pwForm, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">New Password</label>
                  <input 
                    type="password"
                    required
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-[#00d4ff]/50 focus:bg-white/[0.08] outline-none transition-all duration-300"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Confirm New Password</label>
                  <input 
                    type="password"
                    required
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-[#00d4ff]/50 focus:bg-white/[0.08] outline-none transition-all duration-300"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({...pwForm, confirmPassword: e.target.value})}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={pwSaving}
                className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-8 py-4 text-xs font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
              >
                {pwSaving ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} className="text-[#00d4ff]" />}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
