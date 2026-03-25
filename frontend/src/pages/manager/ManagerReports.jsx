import { useEffect, useState } from "react";
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
  }, []);

  /**
   * Aggregates task and submission data to synthesize periodic reports.
   */
  const fetchReports = async () => {
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
        } catch (err) {
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
  };

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
          <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-tight">Reports</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-0.5 w-10 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Generate and manage reports</p>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
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
              className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden group hover:bg-white/[0.08] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 blue-glow shadow-inner">
                  <FileText size={24} />
                </div>

                <div>
                  <p className="font-black text-white uppercase tracking-tight text-lg">{report.title}</p>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">
                    {report.category} • {report.date}
                  </p>
                </div>
              </div>

              {/* BLUE DOWNLOAD BUTTON */}
              <button
                onClick={() => downloadReport(report)}
                className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
              >
                <Download size={16} className="text-[#00d4ff]" />
                Download
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">No reports available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerReports;
