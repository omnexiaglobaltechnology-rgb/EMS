import { FileText, Download, Plus } from "lucide-react";
import { downloadReport, downloadAllReports } from "../../utils/downloadReport";

const reports = [
  {
    id: 1,
    name: "Supply Chain Efficiency Audit",
    description: "Quarterly analysis of logistics lead times and transit costs",
    date: "Feb 12, 2026",
    author: "Logistics Division",
    action: "download",
  },
  {
    id: 2,
    name: "Operational Risk Assessment",
    description:
      "Evaluation of safety protocols and equipment maintenance cycles",
    date: "Feb 10, 2026",
    author: "Operations Compliance",
    action: "download",
  },
  {
    id: 3,
    name: "Vendor SLA Compliance Summary",
    description:
      "Performance review of 3rd party service providers and partners",
    date: "Feb 08, 2026",
    author: "Procurement Office",
    action: "download",
  },
  {
    id: 4,
    name: "Warehouse Overhead & Utility Report",
    description:
      "Analysis of physical infrastructure costs across all regional hubs",
    date: "Feb 05, 2026",
    author: "Infrastructure Ops",
    action: "download",
  },
  {
    id: 5,
    name: "Process Automation ROI Study",
    description: "Impact of new ERP integration on manual workflow reduction",
    date: "Feb 01, 2026",
    author: "Operational Excellence",
    action: "download",
  },
];

/**
 * Document hub exclusively detailing operational audits, logistics reports,
 * and compliance documentation structured for COO oversight.
 */
const CooReports = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations Reports</h1>
          <p className="text-slate-500">
            Generate and manage departmental audits and execution logs
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white">
            <Plus size={16} />
            New Audit
          </button>
          <button
            onClick={() => downloadAllReports(reports, "coo_reports")}
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
          <option>All Operations</option>
          <option>Logistics</option>
          <option>Supply Chain</option>
          <option>Compliance</option>
        </select>

        <select className="rounded-lg border border-gray-300 px-4 py-2">
          <option>This Quarter</option>
          <option>This Month</option>
        </select>

        <input
          type="text"
          placeholder="Search Operation Report..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
        />
      </div>

      {/* Table Wrapper */}
      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 border-b border-gray-300 bg-slate-50 px-6 py-4 text-sm font-semibold">
          <div>Report Name</div>
          <div>Last Updated</div>
          <div>Department/Author</div>
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
            <div className="flex items-center text-sm">{report.date}</div>

            {/* Author */}
            <div className="flex items-center text-sm">{report.author}</div>

            {/* Action Button */}
            <div className="flex items-center justify-end">
              {report.action === "download" ? (
                <button
                  onClick={() => downloadReport(report)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm"
                >
                  Download
                </button>
              ) : (
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm">
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

export default CooReports;
