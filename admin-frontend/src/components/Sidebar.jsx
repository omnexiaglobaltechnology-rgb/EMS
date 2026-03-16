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
      <div className="flex items-center gap-3 px-4 py-8 mb-2 text-left text-white border-b border-white/10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/80 backdrop-blur-md text-sm font-semibold uppercase shadow-lg border border-white/20">
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
      <div className="flex-1 px-3 overflow-y-auto space-y-1">
        {MENU[role]?.map((item) => (
          <NavLink
            key={item}
            to={`/${role}/${item}`}
            className={({ isActive }) =>
              `group flex items-center px-4 py-3 font-medium rounded-xl capitalize transition-all duration-200 ${
                isActive 
                  ? "bg-white/15 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`
            }
            end
          >
            {item.replace("-", " ")}
          </NavLink>
        ))}
      </div>

      {/* ---------------- LOGOUT BUTTON ---------------- */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center justify-center gap-2 text-red-400 font-semibold py-3 w-full rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 cursor-pointer border border-red-500/20"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
