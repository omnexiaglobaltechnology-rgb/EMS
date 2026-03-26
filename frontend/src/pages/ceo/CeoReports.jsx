import { useEffect, useState } from "react";
import { FileText, Download, Plus, AlertCircle, Loader } from "lucide-react";
import { tasksApi, submissionsApi } from "../../utils/api";
import { downloadReport, downloadAllReports } from "../../utils/downloadReport";

/**
 * Reports management hub for the CEO.
 * Aggregates analytical documents and provides export functionality.
 */
const CeoReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  /**
   * Reaches out to the API to gather tasks and process them into summary reports.
   * Computes completion rates to dynamically construct report metadata.
   */
  const fetchReports = async () => {
    try {
      setLoading(true);
      const allTasks = await tasksApi.getAll();
      const completedTasks = allTasks.filter(
        (t) => t.status === "completed",
      ).length;

      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      const generatedReports = [
        {
          id: 1,
          name: `Quarterly Sales Performance (${allTasks.length} Tasks)`,
          description: `Performance from last month - ${completedTasks} completed`,
          date: today,
          author: "CEO Office",
          action: "view",
        },
        {
          id: 2,
          name: "Project Status Summary",
          description: `Overall project progress - ${Math.round((completedTasks / allTasks.length) * 100)}% completion`,
          date: today,
          author: "Project Management",
          action: "view",
        },
        {
          id: 3,
          name: `Team Utilization Analysis (${Math.min(allTasks.length, 100)}%)`,
          description: "Resource allocation and team productivity insights",
          date: today,
          author: "Human Resources",
          action: "download",
        },
      ];

      setReports(generatedReports);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div>
          <p className="font-medium text-red-900">Error loading reports</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-slate-500">Generate and manage reports</p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white">
            <Plus size={16} />
            New Report
          </button>
          <button
            onClick={() => downloadAllReports(reports, "ceo_reports")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            <Download size={16} />
            Export All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select className="rounded-lg border border-gray-300 px-4 py-2">
          <option>All</option>
        </select>

        <select className="rounded-lg border border-gray-300 px-4 py-2">
          <option>This Month</option>
        </select>

        <input
          type="text"
          placeholder="Search Report Name..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
        />
      </div>

      {/* Table Wrapper */}
      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 border-b border-gray-300 bg-slate-50 px-6 py-4 text-sm font-semibold">
          <div>Report Name</div>
          <div>Last Updated</div>
          <div>Author</div>
          <div className="text-right">Actions</div>
        </div>

        {/* Rows */}
        {reports.map((report) => (
          <div
            key={report.id}
            className="grid grid-cols-4 gap-4 border-b border-gray-300 px-6 py-5 last:border-none"
          >
            {/* Report Info */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <FileText size={18} />
              </div>
              <div>
                <p className="font-medium">{report.name}</p>
                <p className="text-sm text-slate-500">{report.description}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center">{report.date}</div>

            {/* Author */}
            <div className="flex items-center">{report.author}</div>

            {/* Action Button (visual only) */}
            <div className="flex items-center justify-end">
              {report.action === "download" ? (
                <button
                  onClick={() => downloadReport(report)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                  Download
                </button>
              ) : (
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">
                  View Details
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CeoReports;
