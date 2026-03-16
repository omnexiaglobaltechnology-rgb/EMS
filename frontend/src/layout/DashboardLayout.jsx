import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";
import useActivityTracking from "../hooks/useActivityTracking";
import { useTheme } from "../context/ThemeContext";

/**
 * DashboardLayout component serves as the primary wrapper for authenticated pages.
 * Handles mobile sidebar state and responsive main content area.
 */
const DashboardLayout = () => {
  useActivityTracking();
  const { theme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen text-white relative">
      {/* Sidebar - responsive visibility */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Topbar - with hamburger toggle */}
      <Topbar onToggleSidebar={toggleSidebar} />

      {/* Main content container */}
      <div className={`transition-all duration-300 md:ml-64 pt-14`}>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
