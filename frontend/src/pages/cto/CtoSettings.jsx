import { useState, useEffect } from "react";
import { User, Upload, Mail, Lock, Bell, Trash2, Save } from "lucide-react";
import { useSelector } from "react-redux";
import { authApi } from "../../utils/api";

/**
 * User profile and security configuration portal for the CTO.
 * Manages personal credentials, contact details, and notification preferences.
 */
const CtoSettings = () => {
  const auth = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: auth?.name || "",
    email: auth?.email || "",
    personalEmail: auth?.personalEmail || "",
    currentPassword: "",
    newPassword: "",
    emailNotifications: false,
    inAppNotifications: true,
  });

  useEffect(() => {
    if (auth) {
      setForm(prev => ({
        ...prev,
        name: auth.name,
        email: auth.email,
        personalEmail: auth.personalEmail || ""
      }));
    }
  }, [auth]);

  /**
   * Unified state updater for account settings inputs, supporting both
   * textual value mapping and boolean checkbox toggling.
   *
   * @param {Event} e - HTML input event
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* PAGE TITLE */}
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* CARD */}
      <div className="rounded-xl border border-gray-300 bg-white p-6 space-y-6">
        {/* GENERAL ACCOUNT SETTINGS */}
        <div className="space-y-4">
          <h2 className="font-medium text-lg">General Account Settings</h2>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="text-slate-500" />
            </div>

            <div className="flex-1 space-y-2">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Full Name"
              />

              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  name="email"
                  value={form.email}
                  disabled
                  className="w-full rounded border border-gray-100 bg-slate-50 pl-9 pr-3 py-2 text-slate-400"
                  placeholder="Email Address"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-indigo-500" />
                <input
                  name="personalEmail"
                  value={form.personalEmail}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 pl-9 pr-3 py-2 focus:ring-2 focus:border-indigo-500 outline-none"
                  placeholder="Personal Gmail (for notifications)"
                />
              </div>
            </div>

            <button className="flex items-center gap-2 rounded bg-slate-100 px-3 py-2 text-sm">
              <Upload size={16} />
              Upload
            </button>
          </div>
        </div>

        {/* PASSWORD & SECURITY */}
        <div className="space-y-4">
          <h2 className="font-medium text-lg">Password & Security</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 pl-9 pr-3 py-2"
                placeholder="Current Password"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 pl-9 pr-3 py-2"
                placeholder="Change Password"
              />
            </div>
          </div>
        </div>

        {/* NOTIFICATION PREFERENCES */}
        <div className="space-y-4">
          <h2 className="font-medium text-lg">Notification Preferences</h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <span>Email Notifications</span>
            </div>

            <input
              type="checkbox"
              name="emailNotifications"
              checked={form.emailNotifications}
              onChange={handleChange}
              className="h-5 w-5 accent-indigo-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <span>In-App Notifications</span>
            </div>

            <input
              type="checkbox"
              name="inAppNotifications"
              checked={form.inAppNotifications}
              onChange={handleChange}
              className="h-5 w-5 accent-indigo-600"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between pt-4">
          <button className="flex items-center gap-2 rounded bg-red-500 px-4 py-2 text-white">
            <Trash2 size={16} />
            Delete Account
          </button>

          <div className="flex gap-3">
            <button className="rounded border border-gray-300 px-4 py-2 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button 
              onClick={async () => {
                try {
                  await authApi.updateProfile({ personalEmail: form.personalEmail });
                  alert("Profile updated successfully!");
                } catch (err) {
                  alert("Failed to update: " + err.message);
                }
              }}
              className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 transition-all font-bold shadow-md flex items-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CtoSettings;
