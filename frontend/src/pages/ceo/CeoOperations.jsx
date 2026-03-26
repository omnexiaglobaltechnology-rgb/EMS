import { useState } from "react";
import CooDashboard from "../coo/CooDashboard";
import CooOrganization from "../coo/CooOrganization";
import CooAnalytics from "../coo/CooAnalytics";
import CooReports from "../coo/CooReports";

/**
 * Operations Portal for the CEO.
 * Provides a specialized view into the COO's dashboard, organization, and operational metrics.
 */
const CeoOperations = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "organization", label: "Organization" },
    { id: "analytics", label: "Analytics" },
    { id: "reports", label: "Reports" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <CooDashboard />;
      case "organization":
        return <CooOrganization />;
      case "analytics":
        return <CooAnalytics />;
      case "reports":
        return <CooReports />;
      default:
        return <CooDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Portal</h1>
          <p className="text-slate-500 text-sm">Overseeing COO Performance & Systemic Efficiency</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Content */}
      <div className="animate-in fade-in duration-500">
        {renderContent()}
      </div>
    </div>
  );
};

export default CeoOperations;
