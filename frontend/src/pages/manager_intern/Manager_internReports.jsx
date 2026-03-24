import { useState, useEffect } from "react";
import { FileText, Download, Plus, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { tasksApi, submissionsApi } from "../../utils/api";
import { downloadReport } from "../../utils/downloadReport";

const Manager_internReports = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAndSynthesizeReports();
  }, []);

  const fetchAndSynthesizeReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tasks to generate reports from
      const allTasks = await tasksApi.getAll();
      
      // Filter or group data for reports
      const completedTasks = allTasks.filter(t => t.status === "completed");
      const activeTasks = allTasks.filter(t => ["assigned", "delegated", "under_review"].includes(t.status));
      const submittedTasks = allTasks.filter(t => ["submitted", "under_review"].includes(t.status));

      // Synthesize reports based on current data
      const synthesized = [];

      if (allTasks.length > 0) {
        synthesized.push({
          id: "rep_tasks_summary",
          title: `Tasks Summary (${allTasks.length} total)`,
          category: "Performance",
          date: new Date().toISOString().split("T")[0],
          description: `Comprehensive summary of all ${allTasks.length} tasks currently in the system.`
        });
      }

      if (completedTasks.length > 0) {
        synthesized.push({
          id: "rep_completion_audit",
          title: `Project Completion Audit (${completedTasks.length} done)`,
          category: "Audit",
          date: new Date().toISOString().split("T")[0],
          description: `Detailed audit report for ${completedTasks.length} successfully completed projects.`
        });
      }

      if (submittedTasks.length > 0) {
        synthesized.push({
          id: "rep_submissions_review",
          title: `Pending Submissions Review (${submittedTasks.length})`,
          category: "Reviews",
          date: new Date().toISOString().split("T")[0],
          description: `Review of ${submittedTasks.length} submissions currently awaiting manager approval.`
        });
      }

      // Add "session" reports from local storage if any
      const sessionReports = JSON.parse(localStorage.getItem("manager_intern_session_reports") || "[]");
      
      setReports([...sessionReports, ...synthesized]);
    } catch (err) {
      console.error("Error synthesizing reports:", err);
      setError("Failed to generate dynamic reports. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    setGenerating(true);
    // Simulate generation and persist to session state (localStorage fallback for "dont change backend")
    setTimeout(() => {
      const newReport = {
        id: `gen_${Date.now()}`,
        title: `On-Demand Analytics Report #${Math.floor(Math.random() * 900) + 100}`,
        category: "On-Demand",
        date: new Date().toISOString().split("T")[0],
        description: "User-generated analytical snapshot of current department metrics."
      };
      
      const sessionReports = JSON.parse(localStorage.getItem("manager_intern_session_reports") || "[]");
      const updatedSession = [newReport, ...sessionReports];
      localStorage.setItem("manager_intern_session_reports", JSON.stringify(updatedSession));
      
      setReports([newReport, ...reports]);
      setGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  const handleDownload = (report) => {
    downloadReport(report);
  };

  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-slate-400 font-medium animate-pulse">Scanning database and synthesizing reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Reports</h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">
            Dynamic database-generated reporting center
          </p>
        </div>

        <div className="flex items-center gap-4">
          {showSuccess && (
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm animate-in fade-in zoom-in duration-300">
              <CheckCircle2 size={18} />
              Report Added!
            </div>
          )}
          <button 
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-95"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus size={18} />
                Generate New Report
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 animate-in shake duration-500">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Filter generated reports..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* REPORT LIST */}
      <div className="grid gap-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="group flex flex-col md:flex-row md:items-center justify-between rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <div className="flex items-center gap-5 mb-4 md:mb-0">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors shadow-inner">
                  <FileText size={28} />
                </div>

                <div>
                  <p className="font-bold text-xl text-white group-hover:text-indigo-300 transition-colors leading-tight">
                    {report.title}
                  </p>
                  <p className="text-slate-400 text-sm mt-1 font-medium flex items-center gap-2">
                    <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider text-slate-300">
                      {report.category}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                    {report.date}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => handleDownload(report)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-bold text-indigo-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all self-start md:self-auto shadow-sm"
              >
                <Download size={18} />
                CSV Export
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white/5 border border-white/10 border-dashed rounded-3xl animate-in fade-in duration-1000">
            <div className="p-6 rounded-full bg-white/5 mb-6">
              <FileText size={48} className="text-slate-700 opacity-30" />
            </div>
            <p className="text-slate-500 font-bold text-lg">No reports generated yet</p>
            <p className="text-slate-600 text-sm mt-2">Click "Generate New Report" to analyze current data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Manager_internReports;
