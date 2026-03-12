import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState } from "react";

import { login } from "../redux/authSlice";
import { authApi } from "../utils/api";

import { Eye, EyeOff, ArrowRight } from "lucide-react";

/**
 * Primary authentication entry point for the application.
 * Manages user credentials, role-based redirection, and developer-friendly quick login paths.
 */
const Login = () => {
  // const quickLoginUsers = [
  //   { role: "intern", email: "intern@owms.com", name: "Intern User" },
  //   { role: "team_lead", email: "teamlead@owms.com", name: "Team Lead User" },
  //   {
  //     role: "team_lead_intern",
  //     email: "tlintern@owms.com",
  //     name: "Team Lead Intern User",
  //   },
  //   { role: "manager", email: "manager@owms.com", name: "Manager User" },
  //   {
  //     role: "manager_intern",
  //     email: "manager_intern@owms.com",
  //     name: "Manager Intern User",
  //   },
  //   { role: "cto", email: "cto@owms.com", name: "CTO User" },
  //   { role: "cfo", email: "cfo@owms.com", name: "CFO User" },
  //   { role: "coo", email: "coo@owms.com", name: "COO User" },
  //   { role: "ceo", email: "ceo@owms.com", name: "CEO User" },
  // ];

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * Authenticates user via email and password.
   * Dispatches user data to Redux and redirects to role-specific dashboard.
   *
   * @param {Event} e - Form submission event
   */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ email, password });
      dispatch(login(response));
      navigate(`/${response.user.role}/dashboard`);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bypasses manual entry for predefined testing accounts (Disabled).
   */
  // const handleQuickLogin = async (userEmail) => {
  //   ...
  // };

  /**
   * Provides formatted display labels for specific technical role keys.
   *
   * @param {string} role - Internal role identifier
   * @returns {string} Human-readable label
   */
  const formatRoleLabel = (role) => {
    if (role === "team_lead") return "Team Lead";
    if (role === "team_lead_intern") return "TL Intern";
    return role;
  };

  const isMeetingsEnabledForRole = (role) => {
    return true;
  };

  const isChatEnabledForRole = (role) => {
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-slate-500">Sign in to access your dashboard</p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignIn} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition cursor-pointer disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}{" "}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Quick login disabled */}
        {/* <div className="grid grid-cols-2 gap-3 mt-4">
          {quickLoginUsers.map((u) => (
            <button
              key={u.email}
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin(u.email)}
              className="rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Login as {formatRoleLabel(u.role)}
            </button>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default Login;
