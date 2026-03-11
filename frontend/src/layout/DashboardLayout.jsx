import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";
import useActivityTracking from "../hooks/useActivityTracking";

// Fixed dimensions used to offset the main content area
const SIDEBAR_WIDTH = 256; // 64 * 4 (w-64)
const TOPBAR_HEIGHT = 56; // 14 * 4 (h-14)

/**
 * DashboardLayout component serves as the primary wrapper for authenticated pages.
 * It renders the persistent Sidebar and Topbar interfaces, and uses React Router's
 * <Outlet /> to render nested child route components within the main content area.
 */
const DashboardLayout = () => {
  useActivityTracking();

  return (
    <div>
      {/* Global Navigation Components */}
      <Sidebar />
      <Topbar />

      {/* Offset container for nested routes */}
      <div
        className="main-content"
        style={{
          marginLeft: SIDEBAR_WIDTH,
          marginTop: TOPBAR_HEIGHT,
          minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        }}
      >
        <main className="p-6">
          {/* Render matching child route elements here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
