import { useState } from "react";

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

      {/* Save Button */}
      <div>
        <button
          onClick={handleSave}
          className="rounded-lg bg-slate-900 px-6 py-2 text-white hover:bg-slate-800"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
