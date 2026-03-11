import { Building2, Users } from "lucide-react";

const departments = [
  {
    id: 1,
    name: "Engineering",
    head: "John Smith",
    employees: 45,
    budget: "$1.2M",
    note: "Highest R&D spend",
  },
  {
    id: 2,
    name: "Sales",
    head: "Jane Doe",
    employees: 32,
    budget: "$800K",
    note: "Revenue-driving unit",
  },
  {
    id: 3,
    name: "Marketing",
    head: "Bob Wilson",
    employees: 18,
    budget: "$500K",
    note: "Customer acquisition costs",
  },
  {
    id: 4,
    name: "Operations",
    head: "Carol Brown",
    employees: 28,
    budget: "$600K",
    note: "Operational & logistics costs",
  },
];

/**
 * Department-level overview dashboard for the CFO.
 * Visualizes the cost distribution, budget caps, and structural insights across major business units.
 */
const CfoOrganization = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Financial Organization Overview
        </h1>
        <p className="mt-1 text-slate-500">
          Department-wise budget ownership and cost distribution
        </p>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                <Building2 className="h-6 w-6 text-indigo-600" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  {dept.name}
                </h2>

                <p className="text-slate-500">
                  Budget Owner:{" "}
                  <span className="font-medium text-slate-700">
                    {dept.head}
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{dept.employees} cost-linked employees</span>
                  </div>

                  <div>
                    Annual Budget:{" "}
                    <span className="font-medium text-slate-700">
                      {dept.budget}
                    </span>
                  </div>
                </div>

                {/* CFO-specific insight */}
                <p className="pt-2 text-sm text-slate-500">{dept.note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CfoOrganization;
