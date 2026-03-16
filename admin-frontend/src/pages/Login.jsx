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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Circles - enhanced for glass effect */}
      <div className="absolute top-[10%] left-[10%] w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse delay-700"></div>

      {/* Main Card Container - GLASS VERSION */}
      <div className="w-full max-w-5xl glass-dark rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[650px] relative z-10 border border-white/30">
        
        {/* ---------------- LEFT PANEL: BRANDING ---------------- */}
        <div className="md:w-1/2 p-16 flex flex-col items-center justify-center relative bg-white/30 border-r border-white/30">
           {/* Big Centered Logo */}
           <div className="text-center animate-in fade-in zoom-in duration-1000 w-full relative">
              <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full"></div>
              <img src="/assets/logo.png" alt="OMNEXIA Logo" className="w-full max-w-sm h-auto relative z-10 drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)] mx-auto" />
              <div className="mt-12 space-y-3 relative z-10">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Omnexia</h2>
                <div className="h-1 w-20 bg-[#00fbff] mx-auto rounded-full shadow-[0_0_15px_rgba(0,251,255,1)]"></div>
                <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Administrative Command</p>
              </div>
           </div>

           {/* Mobile-only divider */}
           <div className="md:hidden w-full h-px bg-white/30 my-8"></div>
        </div>

        {/* ---------------- RIGHT PANEL: LOGIN FORM ---------------- */}
        <div className="flex-1 p-10 lg:p-20 flex flex-col justify-center relative overflow-hidden">
          <div className="max-w-sm mx-auto w-full relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center px-5 py-2 bg-cyan-500/30 text-[#00fbff] rounded-full mb-6 text-[10px] font-black uppercase tracking-[0.2em] border border-cyan-500/30 backdrop-blur-3xl cyan-glow">
                 Secure Admin Entry
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter">Welcome</h1>
              <p className="text-white/30 mt-3 font-bold uppercase tracking-widest text-[10px]">Accessing Internal Systems</p>
            </div>

            {error && (
              <div className="mb-8 p-5 rounded-2xl bg-red-500/30 border border-red-500/30 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs text-red-300 font-bold flex items-center gap-3 uppercase tracking-wider">
                  <span className="text-base">⚠️</span> {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-8">
              <div className="group">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 ml-1">
                  Cloud Identity
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#00fbff] transition-colors">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@omnexia.in"
                    autoComplete="email"
                    className="w-full bg-transparent border-b-2 border-white/30 pl-10 pb-3 text-white placeholder-white/30 transition-all focus:outline-none focus:border-[#00fbff] text-sm font-bold tracking-wide"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 ml-1">
                  Secure Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#00fbff] transition-colors">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full bg-transparent border-b-2 border-white/30 pl-10 pb-3 text-white placeholder-white/30 transition-all focus:outline-none focus:border-[#00fbff] text-sm font-bold tracking-wide"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-2 flex items-center text-white/20 hover:text-[#00fbff] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full cyan-button py-5 rounded-2xl font-black uppercase tracking-[0.2em] mt-6 text-xs flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-[#00fbff] rounded-full animate-spin"></div>
                ) : (
                  <>Authorize Entry <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
