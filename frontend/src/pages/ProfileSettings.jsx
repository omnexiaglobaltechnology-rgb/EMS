import { useState, useEffect } from "react";
import { Mail, Shield, Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
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
      // Fetch latest profile data if not in redux
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
      
      // Note: Ideally, we'd update Redux state here too
      // dispatch(updateAuth({ personalEmail })); 
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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-12 -m-4 md:-m-6">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-8 -m-4 md:-m-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">Account Settings</h1>
          <p className="text-[13px] text-slate-300 font-bold mt-1.5 opacity-80">Manage your personal information and notification preferences.</p>
        </div>

      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        } shadow-lg backdrop-blur-md animate-in slide-in-from-top-4`}>
          {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      {pwMessage && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          pwMessage.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        } shadow-lg backdrop-blur-md animate-in slide-in-from-top-4`}>
          {pwMessage.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{pwMessage.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Left: User Card */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] border border-white/10 p-8 text-center space-y-4 shadow-2xl h-fit hover:bg-white/10 hover:border-white/20 transition-all duration-500 relative overflow-hidden group">
            <div className="h-28 w-28 bg-indigo-500/10 rounded-[32px] flex items-center justify-center mx-auto text-indigo-400 text-4xl font-black shadow-inner border-2 border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all duration-500">
              {auth?.name?.charAt(0) || "U"}
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-black text-white">{auth?.name}</h2>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{auth?.role?.replace(/_/g, " ")}</p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6">
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 py-3 rounded-2xl border border-emerald-500/20 shadow-lg">
                <Shield size={16} />
                <span>Verified Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Settings Forms */}
        <div className="lg:col-span-2 space-y-10">
          {/* PERSONAL INFO FORM */}
          <form onSubmit={handleSave} className="bg-white/5 backdrop-blur-2xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/20">
            <div className="px-8 py-6 border-b border-white/5 bg-white/5">
              <h3 className="text-lg font-black text-white">Email Notifications</h3>
              <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.15em] mt-1.5">Configure where you receive system alerts.</p>
            </div>

            <div className="p-10 space-y-6">
              <div className="space-y-4 p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="p-4 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/20 shrink-0">
                    <Mail size={24} />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-300 block mb-2">Personal Gmail Address</label>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed mb-4">
                      Add your personal Gmail to receive instant notifications for meeting schedules and assignments.
                    </p>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-6 py-4 text-sm focus:bg-white/5 focus:border-indigo-500 transition-all outline-none font-bold text-white placeholder:text-slate-600 shadow-inner"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-black/20 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-3 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 active:scale-95"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                SAVE CHANGES
              </button>
            </div>
          </form>

          {/* PASSWORD CHANGE FORM */}
          <form onSubmit={handlePwChange} className="bg-white/5 backdrop-blur-2xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/20">
            <div className="px-8 py-6 border-b border-white/5 bg-white/5">
              <h3 className="text-lg font-black text-white">Password & Security</h3>
              <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.15em] mt-1.5">Update your account password regularly for better security.</p>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-300 block px-2">Current Password</label>
                  <input 
                    type="password"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-6 py-4 text-sm focus:bg-white/5 focus:border-indigo-500 transition-all outline-none font-bold text-white placeholder:text-slate-600 shadow-inner"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({...pwForm, currentPassword: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-300 block px-2">New Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-6 py-4 text-sm focus:bg-white/5 focus:border-indigo-500 transition-all outline-none font-bold text-white placeholder:text-slate-600 shadow-inner"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-300 block px-2">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-6 py-4 text-sm focus:bg-white/5 focus:border-indigo-500 transition-all outline-none font-bold text-white placeholder:text-slate-600 shadow-inner"
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({...pwForm, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-black/20 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={pwSaving}
                className="flex items-center gap-3 rounded-2xl bg-slate-800 px-8 py-4 text-sm font-black text-white hover:bg-slate-700 transition-all shadow-lg ring-1 ring-white/10 disabled:opacity-50 active:scale-95"
              >
                {pwSaving ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                UPDATE PASSWORD
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProfileSettings;
