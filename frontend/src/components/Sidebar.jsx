import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";

import { MENU } from "../auth/menu";
import { logout } from "../redux/authSlice";
import { authApi } from "../utils/api";
import { trackingApi } from "../utils/api";

/**
 * Sidebar component that adapts the navigational menu based on the user's role.
 * Responsive version: hidden on mobile by default, slide-in when isOpen is true.
 */
const Sidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Pull relevant user information from global Redux auth state
  const { role, name, position, department_name } = useSelector(
    (state) => state.auth,
  );

  // If role is undefined/null, do not render the sidebar
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
      className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#090E1A] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* ---------------- USER INFO SECTION ---------------- */}
      <div className="flex items-center gap-3 px-4 py-6 mb-2 text-left text-white border-b border-gray-300/30">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold uppercase">
          {name?.substring(0, 2) || "UN"}
        </div>
        <div className="leading-tight overflow-hidden">
          <p className="text-sm font-semibold truncate">{name || "User Name"}</p>
          <p className="text-xs text-slate-300 capitalize truncate">
            {position || role} / {department_name || "Dept"}
          </p>
        </div>
      </div>

      {/* ---------------- NAVIGATION LINKS ---------------- */}
      <div className="flex-1 px-3 overflow-y-auto">
        {MENU[role]?.map((item) => (
          <NavLink
            key={item}
            to={`/${role}/${item}`}
            onClick={() => { if(window.innerWidth < 768) onClose(); }}
            className={({ isActive }) =>
              `block px-3 ps-5 py-2 my-2 font-semibold rounded-lg capitalize transition-colors duration-150 ${
                isActive ? "bg-[#10192D] text-blue-500" : "hover:bg-[#10192D]"
              }`
            }
            end
          >
            {item.replace("-", " ")}
          </NavLink>
        ))}

        {/* ---------------- PWA INSTALL BUTTON ---------------- */}
        {installPrompt && (
          <button
            onClick={handleInstall}
            className="w-full mt-4 flex items-center gap-3 px-3 py-2 text-sm font-semibold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-lg transition-all border border-emerald-400/30"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Install App (WebAPK)
          </button>
        )}
      </div>

      {/* ---------------- LOGOUT BUTTON ---------------- */}
      <button
        onClick={handleLogout}
        className="text-red-500 font-semibold py-4 w-full bg-transparent hover:bg-red-900/20 transition-colors duration-150 border-t border-[#2d3748] mt-auto cursor-pointer"
      >
        Log Out
      </button>
    </aside>
  );
};

export default Sidebar;
