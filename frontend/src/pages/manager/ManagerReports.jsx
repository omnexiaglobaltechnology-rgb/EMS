import { useEffect, useState, useCallback } from "react";
import { FileText, Download, Plus, AlertCircle, Loader } from "lucide-react";
import { tasksApi, submissionsApi } from "../../utils/api";
import { downloadReport } from "../../utils/downloadReport";

/**
 * Reporting dashboard for managers.
 * Generates summaries of weekly performance, task counts, and submission volumes.
 */
const ManagerReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /**
   * Aggregates task and submission data to synthesize periodic reports.
   */
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allTasks = await tasksApi.getAll();
      const allSubmissions = [];

      for (const task of allTasks) {
        try {
          const taskId = task.id || task._id;
          if (!taskId) continue;
          const taskSubmissions = await submissionsApi.getByTask(taskId);
          allSubmissions.push(...taskSubmissions);
        } catch {
          console.warn(`Could not fetch submissions for task ${task.id}`);
        }
      }

      // Generate reports from real data
      const generatedReports = [
        {
          id: 1,
          title: "Weekly Performance Report",
          category: "Performance",
          date: new Date().toISOString().split("T")[0],
        },
        {
          id: 2,
          title: `Tasks Summary (${allTasks.length} total)`,
          category: "Performance",
          date: new Date().toISOString().split("T")[0],
        },
        {
          id: 3,
          title: `Submissions Report (${allSubmissions.length} submissions)`,
          category: "Resources",
          date: new Date().toISOString().split("T")[0],
        },
        {
          id: 4,
          title: "Project Status Update",
          category: "Projects",
          date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        },
      ];

      setReports(generatedReports);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">Generate and manage reports</p>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <Plus size={16} />
          Generate Report
        </button>
      </div>

      {/* REPORT LIST */}
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between rounded-xl border border-gray-300 bg-white p-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FileText size={22} />
                </div>

                <div>
                  <p className="font-medium text-lg">{report.title}</p>
                  <p className="text-slate-500 text-sm">
                    {report.category} • {report.date}
                  </p>
                </div>
              </div>

              {/* BLUE DOWNLOAD BUTTON */}
              <button
                onClick={() => downloadReport(report)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-gray-300 bg-white p-6 text-center text-gray-500">
            No reports available
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerReports;
