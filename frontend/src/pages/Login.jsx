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
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const quotes = [
    {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
    },
    {
      text: "Innovation distinguishes between a leader and a follower.",
      author: "Steve Jobs",
    },
    {
      text: "Strive not to be a success, but rather to be of value.",
      author: "Albert Einstein",
    },
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ email, password });
      
      if (response.user.role === "admin") {
        throw new Error("Admins should use the Admin Panel to log in.");
      }

      dispatch(login(response));
      navigate(`/${response.user.role}/dashboard`);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
      {/* ---------------- LEFT PANEL: MOTIVATIONAL ---------------- */}
      <div className="hidden md:flex md:w-1/2 bg-[#090E1A] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
        
        <div className="relative z-10">
          <img src="/assets/logo.png" alt="OMNEXIA Logo" className="h-12 w-auto brightness-0 invert" onError={(e) => e.target.style.display = 'none'} />
          <h2 className="text-white text-xl font-bold mt-4 tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
               <img src="/assets/icon.png" alt="" className="w-5 h-5 invert" />
            </span>
            Omnexia Technology
          </h2>
        </div>

        <div className="relative z-10 max-w-lg">
          <blockquote className="space-y-4">
            <p className="text-3xl lg:text-4xl font-light text-white leading-tight italic">
              "{randomQuote.text}"
            </p>
            <footer className="text-indigo-400 font-medium tracking-wide uppercase text-sm">
              — {randomQuote.author}
            </footer>
          </blockquote>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
          © 2024 Omnexia Technology Global. All rights reserved.
        </div>
      </div>

      {/* ---------------- RIGHT PANEL: LOGIN FORM ---------------- */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-8">
            <img src="/assets/logo.png" alt="OMNEXIA" className="h-10 w-auto" />
          </div>

          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
              <p className="mt-2 text-slate-500">Please enter your credentials to continue</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-red-600 font-medium flex gap-2">
                  <span className="shrink-0">⚠️</span> {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@omnexiatechnology.in"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 pr-12 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#090E1A] py-4 text-sm font-bold text-white hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign in to Account
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
