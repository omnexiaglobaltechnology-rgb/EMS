import { useSelector, useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";

import { MENU } from "../auth/menu";
import { logout } from "../redux/authSlice";
import { authApi } from "../utils/api";
import { trackingApi } from "../utils/api";

/**
 * Sidebar component that adapts the navigational menu based on the user's role.
 * Links are dynamically drawn from the MENU configuration matching the active role.
 */
const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Pull relevant user information from global Redux auth state
  const { role, name, position, department_name } = useSelector(
    (state) => state.auth,
  );

  // If role is undefined/null, do not render the sidebar (e.g. before login is complete)
  if (!role) return null;

  const handleLogout = async () => {
    try {
      await authApi.logout();
      // Log the logout event for tracking
      try {
        await trackingApi.logLogout();
      } catch (error) {
        console.warn("[tracking] logout event failed:", error.message);
      }
    } catch (error) {
      // Clear client auth state even if the server cookie is already invalid.
      console.error("Failed to clear auth cookie:", error);
    } finally {
      dispatch(logout());
      navigate("/");
    }
  };

  return (
    <aside
      className="w-64 bg-[#090E1A] text-white min-h-screen flex flex-col fixed left-0 top-0 h-screen z-40 shadow-lg"
      style={{ width: 256 }}
    >
      {/* ---------------- USER INFO SECTION ---------------- */}
      <div className="flex items-center gap-3 px-4 py-6 mb-2 text-left text-white border-b border-gray-300/30">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold uppercase">
          {name?.substring(0, 2) || "UN"}
        </div>
        <div className="leading-tight overflow-hidden">
          {/* User's Name */}
          <p className="text-sm font-semibold truncate">
            {name || "User Name"}
          </p>

          {/* Position / Department Name */}
          <p className="text-xs text-slate-300 capitalize truncate">
            {position || role} / {department_name || "Department"}
          </p>
        </div>
      </div>

      {/* ---------------- NAVIGATION LINKS ---------------- */}
      <div className="flex-1 px-3 overflow-y-auto">
        {MENU[role]?.map((item) => (
          <NavLink
            key={item}
            to={`/${role}/${item}`}
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
