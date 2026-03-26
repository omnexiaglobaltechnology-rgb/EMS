import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  Loader,
  AlertCircle,
} from "lucide-react";
import { departmentsApi } from "../utils/api";

/**
 * Department management page for the Admin panel.
 * Allows creating/editing/deleting departments for both employee and intern tracks.
 */
const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [activeTab, setActiveTab] = useState("employee");

  const [form, setForm] = useState({
    name: "",
    type: "employee",
    description: "",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await departmentsApi.getAll();
      setDepartments(data);
    } catch (err) {
      setError(err.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Department name is required");
      return;
    }
    try {
      setError(null);
      const payload = {
        name: form.name,
        description: form.description,
        parentId: form.parentId || null,
      };
      if (editDept) {
        await departmentsApi.update(editDept._id || editDept.id, payload);
      } else {
        await departmentsApi.create({ ...payload, type: form.type });
      }
      setShowModal(false);
      setEditDept(null);
      setForm({ name: "", type: activeTab, description: "", parentId: "" });
      await fetchDepartments();
    } catch (err) {
      setError(err.message || "Failed to save department");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this department? Users in it will be unassigned."))
      return;
    try {
      setError(null);
      await departmentsApi.delete(id);
      await fetchDepartments();
    } catch (err) {
      setError(err.message || "Failed to delete department");
    }
  };

  const openEdit = (dept) => {
    setEditDept(dept);
    setForm({
      name: dept.name,
      type: dept.type,
      description: dept.description || "",
      parentId: dept.parentId?._id || dept.parentId?.id || "",
    });
    setShowModal(true);
  };

  const openAdd = (parentId = "") => {
    setEditDept(null);
    setForm({ name: "", type: activeTab, description: "", parentId });
    setShowModal(true);
  };

  const filtered = departments.filter((d) => d.type === activeTab);
  // Only allow top-level departments (no parent) of same type as potential parents
  const parentOptions = filtered.filter(d => !d.parentId && (!editDept || (d._id !== editDept._id && d.id !== editDept.id)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-500 text-sm">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 size={24} /> Department / Subdomain Management
          </h1>
          <p className="text-slate-500">
            Create and manage domains (Technical, Non-Tech) and subdomains (MERN, Sales)
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-white text-sm font-medium hover:bg-slate-800"
        >
          <Plus size={16} />
          Add Department
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {["employee", "intern"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab} Domains
          </button>
        ))}
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dept) => (
          <div
            key={dept._id || dept.id}
            className={`rounded-xl border ${dept.parentId ? 'border-indigo-100 bg-indigo-50/30' : 'border-gray-200 bg-white'} p-5 space-y-3 hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-slate-800">
                    {dept.name}
                  </h3>
                  {dept.parentId && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-bold uppercase">
                      Sub
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-xs font-medium text-slate-400 uppercase">
                    {dept.type}
                  </span>
                  {dept.parentId && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-indigo-500 font-medium">
                        Part of {dept.parentId.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {!dept.parentId && (
                  <button
                    onClick={() => openAdd(dept._id || dept.id)}
                    className="p-1.5 rounded hover:bg-indigo-50 text-indigo-400 group/sub"
                    title="Add Sub-domain"
                  >
                    <Plus size={14} className="group-hover/sub:scale-110 transition-transform" />
                  </button>
                )}
                <button
                  onClick={() => openEdit(dept)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-400"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(dept._id || dept.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {dept.description && (
              <p className="text-sm text-slate-500 line-clamp-2">{dept.description}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Users size={12} />
              <span>
                Created by {dept.createdBy?.name || "Admin"}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Building2 className="mx-auto mb-2 h-12 w-12 opacity-20" />
            <p>No {activeTab} domains yet.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-slate-900">
              {editDept ? "Edit Department / Subdomain" : "Create Department / Subdomain"}
            </h2>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Technical, MERN Stack, Sales"
              />
            </div>

            {!editDept && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Track</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="employee">Employee</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Parent Domain (Optional)</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <option value="">None (Top Level)</option>
                {parentOptions.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Choose a parent if this is a sub-department or special stack.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 font-medium text-sm">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditDept(null);
                }}
                className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                {editDept ? "Save Changes" : "Create Department"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartments;
