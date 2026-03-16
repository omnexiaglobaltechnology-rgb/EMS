import { useState, useEffect } from "react";

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
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-white/60 font-medium">Configure system-wide preferences and security</p>
      </div>

      <div className="grid gap-8">
        {/* General Settings */}
        <div className="card-glass p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
            General Settings
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange("supportEmail", e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card-glass p-8 space-y-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            Security Settings
          </h2>

          <div className="divide-y divide-white/5">
            {/* Two Factor Auth */}
            <div className="flex items-center justify-between py-6 first:pt-0">
              <div>
                <p className="font-bold text-white">Two-Factor Authentication</p>
                <p className="text-sm text-white/40">Require 2FA for all users</p>
              </div>

              <button
                onClick={() =>
                  handleChange("twoFactorAuth", !settings.twoFactorAuth)
                }
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
                  settings.twoFactorAuth ? "bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    settings.twoFactorAuth ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Session Timeout */}
            <div className="flex items-center justify-between py-6 last:pb-0">
              <div>
                <p className="font-bold text-white">Session Timeout</p>
                <p className="text-sm text-white/40">
                  Auto logout after 30 minutes of inactivity
                </p>
              </div>

              <button
                onClick={() =>
                  handleChange("sessionTimeout", !settings.sessionTimeout)
                }
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
                  settings.sessionTimeout ? "bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    settings.sessionTimeout ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="rounded-xl bg-indigo-600 px-10 py-4 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all shadow-xl hover:shadow-indigo-600/25 active:scale-95"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
