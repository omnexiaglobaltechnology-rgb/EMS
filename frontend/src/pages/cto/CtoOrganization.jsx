import { Building2, Users } from "lucide-react";

const departments = [
  {
    id: 1,
    name: "Engineering",
    head: "John Smith",
    employees: 38,
    teamLeads: 6,
    interns: 12,
    budget: "$900K",
  },
  {
    id: 2,
    name: "Platform & Infrastructure",
    head: "Sarah Chen",
    employees: 14,
    teamLeads: 3,
    interns: 4,
    budget: "$650K",
  },
  {
    id: 3,
    name: "QA & Testing",
    head: "David Lee",
    employees: 10,
    teamLeads: 2,
    interns: 6,
    budget: "$250K",
  },
  {
    id: 4,
    name: "DevOps / SRE",
    head: "Emily Davis",
    employees: 8,
    teamLeads: 2,
    interns: 2,
    budget: "$400K",
  },
];

/**
 * Comprehensive technical organization overview for the CTO.
 * Outlines engineering departmental hierarchy, personnel census, and budget allocations.
 */
const CtoOrganization = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Organization</h1>
        <p className="mt-1 text-slate-500">
          Organization structure and departments
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
                  Head:{" "}
                  <span className="font-medium text-slate-700">
                    {dept.head}
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{dept.employees} engineers</span>
                  </div>

                  <div>
                    Team Leads:{" "}
                    <span className="font-medium text-slate-700">
                      {dept.teamLeads}
                    </span>
                  </div>

                  <div>
                    Interns:{" "}
                    <span className="font-medium text-slate-700">
                      {dept.interns}
                    </span>
                  </div>

                  <div>
                    Tech Budget:{" "}
                    <span className="font-medium text-slate-700">
                      {dept.budget}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CtoOrganization;
