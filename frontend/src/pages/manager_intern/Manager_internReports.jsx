import { FileText, Download, Plus } from "lucide-react";

const REPORTS = [
  {
    id: 1,
    title: "Weekly Performance Report",
    category: "Performance",
    date: "2024-01-14",
  },
  {
    id: 2,
    title: "Budget Analysis Q1",
    category: "Finance",
    date: "2024-01-12",
  },
  {
    id: 3,
    title: "Resource Allocation Report",
    category: "Resources",
    date: "2024-01-10",
  },
  {
    id: 4,
    title: "Project Status Update",
    category: "Projects",
    date: "2024-01-08",
  },
];

/**
 * Static reporting view for manager-interns.
 * Lists standardized performance and resource allocation documents.
 */
const Manager_internReports = () => {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">
            Generate and manage-intern reports
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <Plus size={16} />
          Generate Report
        </button>
      </div>

      {/* REPORT LIST */}
      <div className="space-y-4">
        {REPORTS.map((report) => (
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
            <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              <Download size={16} />
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Manager_internReports;
