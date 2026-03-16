import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";

// Fixed dimensions used to offset the main content area
const SIDEBAR_WIDTH = 256;
const TOPBAR_HEIGHT = 80; // 64 (h-16) + 16 (m-4)

/**
 * DashboardLayout component serves as the primary wrapper for authenticated pages.
 * It renders the persistent Sidebar and Topbar interfaces, and uses React Router's
 * <Outlet /> to render nested child route components within the main content area.
 */
const DashboardLayout = () => {
  return (
    <div className="min-h-screen">
      {/* Global Navigation Components */}
      <Sidebar />
      <Topbar />

      {/* Offset container for nested routes */}
      <div
        className="main-content"
        style={{
          marginLeft: SIDEBAR_WIDTH,
          paddingTop: TOPBAR_HEIGHT,
          minHeight: `100vh`,
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
