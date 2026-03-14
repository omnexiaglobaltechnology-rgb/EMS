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
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500">Manage your personal information and notification preferences.</p>
      </div>

      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        } animate-in fade-in slide-in-from-top-2`}>
          {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {pwMessage && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          pwMessage.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        } animate-in fade-in slide-in-from-top-2`}>
          {pwMessage.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{pwMessage.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Left: User Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm h-fit">
            <div className="h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600 text-3xl font-bold">
              {auth?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{auth?.name}</h2>
              <p className="text-sm text-slate-500 font-medium capitalize">{auth?.role?.replace(/_/g, " ")}</p>
            </div>
            <div className="pt-4 border-t border-slate-50">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                <Shield size={14} />
                <span>Verified Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Settings Forms */}
        <div className="lg:col-span-2 space-y-10">
          {/* PERSONAL INFO FORM */}
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
              <h3 className="font-bold text-slate-800">Email Notifications</h3>
              <p className="text-xs text-slate-500">Configure where you receive system alerts.</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg">
                    <Mail size={18} />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-bold text-slate-800 block mb-1">Personal Gmail Address</label>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Add your personal Gmail to receive instant notifications for meeting schedules and assignments.
                    </p>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full max-w-md rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-4 focus:border-indigo-500 ring-indigo-500/5 transition-all outline-none font-medium"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </form>

          {/* PASSWORD CHANGE FORM */}
          <form onSubmit={handlePwChange} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
              <h3 className="font-bold text-slate-800">Password & Security</h3>
              <p className="text-xs text-slate-500">Update your account password regularly for better security.</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Current Password</label>
                  <input 
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:border-indigo-500 ring-indigo-500/5 transition-all font-medium"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({...pwForm, currentPassword: e.target.value})}
                  />
                </div>
                <div className="hidden md:block"></div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">New Password</label>
                  <input 
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:border-indigo-500 ring-indigo-500/5 transition-all font-medium"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                  <input 
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:border-indigo-500 ring-indigo-500/5 transition-all font-medium"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({...pwForm, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={pwSaving}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-8 py-2.5 text-sm font-bold text-white hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
              >
                {pwSaving ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
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
