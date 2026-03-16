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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex items-center justify-between glass-dark p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d4ff]/5 blur-[100px] rounded-full group-hover:bg-[#00d4ff]/10 transition-colors"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight">
            Data <span className="text-[#00d4ff] blue-glow">Extraction</span>
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-1 w-12 bg-[#00d4ff] rounded-full blue-glow"></div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
              Intelligence Synthesis Module
            </p>
          </div>
        </div>

        <button className="blue-button rounded-2xl px-6 py-4 flex items-center gap-3 active:scale-95 z-10">
          <Plus size={18} />
          <span className="text-xs uppercase tracking-widest">New Report</span>
        </button>
      </div>

      {/* REPORT LIST */}
      <div className="grid gap-6">
        {error && (
          <div className="flex items-start gap-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-xs font-bold text-red-200 uppercase tracking-wider">{error}</p>
          </div>
        )}
        
        {reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report.id}
              className="glass p-6 rounded-3xl border border-white/10 flex items-center justify-between group hover:border-[#00d4ff]/30 transition-all duration-500"
            >
              <div className="flex items-center gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/20 group-hover:text-[#00d4ff] group-hover:border-[#00d4ff]/30 transition-all duration-500">
                  <FileText size={24} />
                </div>

                <div>
                  <p className="font-black text-white uppercase tracking-tight text-lg group-hover:blue-glow transition-all">{report.title}</p>
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                    {report.category} <span className="mx-2 text-white/10">•</span> {report.date}
                  </p>
                </div>
              </div>

              <button
                onClick={() => downloadReport(report)}
                className="blue-button rounded-2xl px-5 py-3 flex items-center gap-2 active:scale-95"
              >
                <Download size={16} />
                <span className="text-[10px] uppercase tracking-widest">Execute Download</span>
              </button>
            </div>
          ))
        ) : (
          <p className="text-white/20 text-xs uppercase tracking-[0.3em] italic text-center py-12 glass rounded-3xl border-white/5">
            System waiting for report generation parameters...
          </p>
        )}
      </div>
    </div>
  );
};

export default ManagerReports;
