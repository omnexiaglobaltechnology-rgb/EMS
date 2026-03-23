import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { MENU } from "../auth/menu";
import { logout } from "../redux/authSlice";
import { authApi } from "../utils/api";
import { trackingApi } from "../utils/api";

/**
 * Sidebar component that adapts the navigational menu based on the user's role.
 * Glassmorphic version with Cyber-Blue styling.
 */
const Sidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { role, name, position, department_name } = useSelector(
    (state) => state.auth,
  );

  if (!role) return null;

  const handleLogout = async () => {
    try {
      await authApi.logout();
      try {
        await trackingApi.logLogout();
      } catch (error) {
        console.warn("[tracking] logout event failed:", error.message);
      }
    } catch (error) {
      console.error("Failed to clear auth cookie:", error);
    } finally {
      dispatch(logout());
      navigate("/");
    }
  };

  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-full w-64 glass-dark text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 border-r border-white/20 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* ---------------- USER INFO SECTION ---------------- */}
      <div className="flex items-center gap-3 px-6 py-8 mb-2 text-left text-white border-b border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00d4ff] to-blue-600 text-sm font-black uppercase shadow-lg shadow-blue-500/20">
          {name?.substring(0, 2) || "UN"}
        </div>
        <div className="relative z-10 leading-tight overflow-hidden">
          <p className="text-sm font-black truncate tracking-tight">{name || "User Name"}</p>
          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest truncate mt-0.5">
            {position || role}
          </p>
        </div>
      </div>

      {/* ---------------- NAVIGATION LINKS ---------------- */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
        {MENU[role]?.map((item) => (
          <NavLink
            key={item}
            to={`/${role}/${item}`}
            onClick={() => { if(window.innerWidth < 768) onClose(); }}
            className={({ isActive }) =>
              `flex items-center px-5 py-4 rounded-2xl capitalize transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? "bg-blue-500/20 text-[#00d4ff] shadow-inner border border-blue-500/20" 
                  : "text-white/60 hover:text-white hover:bg-white/5 active:scale-95"
              }`
            }
            end
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#00d4ff] rounded-full shadow-[0_0_10px_rgba(0,212,255,1)]"></div>}
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isActive ? "blue-glow" : ""}`}>
                  {item.replace(/-/g, " ")}
                </span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                   <ArrowRight size={14} className={isActive ? "text-[#00d4ff]" : "text-white/20"} />
                </div>
              </>
            )}
          </NavLink>
        ))}

        {/* ---------------- PWA INSTALL BUTTON ---------------- */}
        {installPrompt && (
          <button
            onClick={handleInstall}
            className="w-full mt-8 flex items-center justify-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[#00d4ff] bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 rounded-2xl transition-all border border-[#00d4ff]/30 blue-glow"
          >
            <div className="h-2 w-2 rounded-full bg-[#00d4ff] animate-pulse" />
            Install Command
          </button>
        )}
      </div>

      {/* ---------------- LOGOUT BUTTON ---------------- */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full py-4 text-red-400 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-red-500/10 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Deauthorize Session
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
