import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";

import { MENU } from "../auth/menu";
import { logout } from "../redux/authSlice";

/**
 * Sidebar component that adapts the navigational menu based on the user's role.
 * Links are dynamically drawn from the MENU configuration matching the active role.
 */
const Sidebar = () => {
  const dispatch = useDispatch();

  // Pull relevant user information from global Redux auth state
  const { role, name, position } = useSelector((state) => state.auth);

  // If role is undefined/null, do not render the sidebar (e.g. before login is complete)
  if (!role) return null;

  return (
    <aside
      className="w-64 glass-dark text-white min-h-screen flex flex-col fixed left-0 top-0 h-screen z-40"
      style={{ width: 256 }}
    >
      {/* ---------------- USER INFO SECTION ---------------- */}
      <div className="flex items-center gap-4 px-5 py-10 mb-2 text-left text-white border-b border-white/30">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/30 backdrop-blur-2xl text-lg font-black cyan-glow shadow-[0_0_20px_rgba(0,251,255,0.2)] border border-white/30">
          {name?.substring(0, 2) || "UN"}
        </div>
        <div className="leading-tight overflow-hidden">
          {/* User's Name */}
          <p className="text-sm font-bold tracking-tight truncate">
            {name || "User Name"}
          </p>

          {/* Position / Department Name */}
          <p className="text-xs text-white/60 capitalize truncate">
            {position || role}
          </p>
        </div>
      </div>

      {/* ---------------- NAVIGATION LINKS ---------------- */}
      <div className="flex-1 px-4 overflow-y-auto space-y-2 mt-4">
        {MENU[role]?.map((item) => (
          <NavLink
            key={item}
            to={`/${role}/${item}`}
            className={({ isActive }) =>
              `group flex items-center px-4 py-3.5 font-bold rounded-2xl capitalize transition-all duration-300 tracking-wide ${
                isActive 
                  ? "bg-white/30 text-[#00fbff] shadow-[0_0_15px_rgba(0,251,255,0.15)] border border-white/30 cyan-glow" 
                  : "text-white/40 hover:bg-white/30 hover:text-white border border-transparent"
              }`
            }
            end
          >
            {item.replace("-", " ")}
          </NavLink>
        ))}
      </div>

      {/* ---------------- LOGOUT BUTTON ---------------- */}
      <div className="p-4 border-t border-white/30">
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center justify-center gap-2 text-red-400 font-semibold py-3 w-full rounded-xl bg-red-500/30 hover:bg-red-500/40 transition-all duration-200 cursor-pointer border border-red-500/30"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
