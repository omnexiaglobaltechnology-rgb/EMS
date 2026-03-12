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

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ email, password });
      
      if (response.user.role !== "admin") {
        throw new Error("Access denied. This panel is for administrators only.");
      }

      dispatch(login(response));
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#00AEEF] p-4 relative overflow-hidden">
      {/* Decorative Background Circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>

      {/* Main Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px] relative z-10 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
        
        {/* ---------------- LEFT PANEL: BRANDING ---------------- */}
        <div className="md:w-1/2 p-12 flex flex-col items-center justify-center relative bg-white border-r border-slate-100">
           {/* Big Centered Logo */}
           <div className="text-center animate-in fade-in zoom-in duration-700 w-full">
              <img src="/assets/logo.png" alt="OMNEXIA Logo" className="w-full max-w-sm h-auto drop-shadow-md mx-auto" />
              <div className="mt-8 space-y-2">
                <h2 className="text-3xl font-extrabold text-[#00AEEF] tracking-tight">Omnexia Technology</h2>
                <p className="text-slate-400 font-medium italic">Administrative Command Center</p>
              </div>
           </div>

           {/* Mobile-only divider */}
           <div className="md:hidden w-full h-px bg-slate-100 my-8"></div>
        </div>

        {/* ---------------- RIGHT PANEL: LOGIN FORM ---------------- */}
        <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center bg-white relative">
          <div className="max-w-sm mx-auto w-full">
            <div className="text-center mb-10 relative">
              {/* Refined Icon Placement (Top Right of Welcome like reference) */}
              <div className="absolute -top-4 -right-4 w-10 h-10 opacity-40 animate-pulse">
                <img src="/assets/icon.png" alt="" className="w-full h-full object-contain" />
              </div>

              <div className="inline-flex items-center justify-center px-4 py-1 bg-red-50 text-red-500 rounded-full mb-4 text-[10px] font-black uppercase tracking-tighter border border-red-100">
                 Admin Portal
              </div>
              <h1 className="text-5xl font-black text-slate-800 tracking-tighter">Welcome</h1>
              <p className="text-slate-400 mt-2 font-medium">Internal System Access Only</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-2 tracking-tight">
                <p className="text-sm text-red-600 font-bold flex items-center gap-2">
                  <span className="text-lg">⚠️</span> {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
                  Admin Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#00AEEF] transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@omnexiatechnology.in"
                    autoComplete="email"
                    className="w-full bg-transparent border-b-2 border-slate-200 pl-8 pb-2 text-slate-800 placeholder-slate-300 transition-all focus:outline-none focus:border-[#00AEEF] text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
                  Security Passcode
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#00AEEF] transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full bg-transparent border-b-2 border-slate-200 pl-8 pb-2 text-slate-800 placeholder-slate-300 transition-all focus:outline-none focus:border-[#00AEEF] text-sm font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-2 flex items-center text-slate-300 hover:text-[#00AEEF] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 py-4 rounded-xl text-white font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all disabled:bg-slate-300 disabled:shadow-none mt-4"
              >
                {loading ? "Verifying..." : "System Entry"}
              </button>
            </form>

            {/* Bottom Graphic (Buildings) */}
            <div className="mt-12 flex justify-center opacity-10">
               <div className="flex items-baseline gap-1">
                 <div className="w-4 h-8 bg-slate-900 rounded-t-sm"></div>
                 <div className="w-4 h-12 bg-slate-900 rounded-t-sm"></div>
                 <div className="w-4 h-16 bg-slate-900 rounded-t-sm"></div>
                 <div className="w-4 h-10 bg-slate-900 rounded-t-sm"></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
