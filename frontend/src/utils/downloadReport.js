// Small utilities to download reports as CSV blobs on the client
export function downloadReport(report) {
  const title = report.title || report.name || "report";
  const date = report.date || new Date().toISOString().split("T")[0];
  const details = report.description || report.category || "";
  const author = report.author || "";

  const rows = [
    ["Title", "Date", "Author", "Details"],
    [title, date, author, details],
  ];

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (title || "report").replace(/[^a-z0-9_-]/gi, "_");
  a.download = `${safeName}_${date}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadAllReports(reports, filename = "reports_export") {
  if (!Array.isArray(reports) || reports.length === 0) return;

  const header = ["Title", "Date", "Author", "Details"];
  const rows = [header];

  for (const r of reports) {
    const title = r.title || r.name || "";
    const date = r.date || "";
    const author = r.author || "";
    const details = r.description || r.category || "";
    rows.push([title, date, author, details]);
  }

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default downloadReport;
