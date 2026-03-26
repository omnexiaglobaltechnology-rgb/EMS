import { useState, useEffect } from "react";
import { authApi } from "../utils/api";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

/**
 * Settings configuration page for Admins.
 * Allows customization of system-wide preferences, which are persisted locally.
 */
const AdminSettings = () => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("adminSettings");
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          companyName: "Omnexia Technology",
          supportEmail: "support@Omnexiatechnology.in",
          twoFactorAuth: false,
          sessionTimeout: true,
        };
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  /**
   * Generic handler to update a specific setting field.
   *
   * @param {string} key - The setting object key
   * @param {any} value - The new value for the setting
   */
  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Persists the current settings object to local storage.
   */
  const handleSave = () => {
    localStorage.setItem("adminSettings", JSON.stringify(settings));
    alert("Settings saved successfully");
  };

  /**
   * Handles individual user password update.
   */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage({ type: "error", text: "All fields are required" });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPasswordMessage({ 
        type: "error", 
        text: error.message || "Failed to update password. Please check your current password." 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">System Settings</h1>
        <p className="text-slate-500">Configure system preferences</p>
      </div>

      {/* General Settings */}
      <div className="rounded-xl border border-gray-300 bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold">General Settings</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium">Company Name</label>
          <input
            type="text"
            value={settings.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Support Email</label>
          <input
            type="email"
            value={settings.supportEmail}
            onChange={(e) => handleChange("supportEmail", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Security Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-xl border border-gray-300 bg-white p-6 space-y-6">
          <h2 className="text-lg font-semibold">Security Settings</h2>

          {/* Two Factor Auth */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-slate-500">Require 2FA for all users</p>
            </div>

            <button
              onClick={() =>
                handleChange("twoFactorAuth", !settings.twoFactorAuth)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.twoFactorAuth ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  settings.twoFactorAuth ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Session Timeout */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session Timeout</p>
              <p className="text-sm text-slate-500">
                Auto logout after 30 minutes
              </p>
            </div>

            <button
              onClick={() =>
                handleChange("sessionTimeout", !settings.sessionTimeout)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.sessionTimeout ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  settings.sessionTimeout ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="rounded-xl border border-gray-300 bg-white p-6 space-y-5">
          <h2 className="text-lg font-semibold">Change Admin Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordMessage.text && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {passwordMessage.text}
              </div>
            )}

            <div className="space-y-1 relative">
              <label className="text-sm font-medium">Current Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">New Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Min. 6 characters"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Confirm New Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="rounded-lg bg-slate-900 px-6 py-2 text-white hover:bg-slate-800 transition"
        >
          Save System Preferences
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
