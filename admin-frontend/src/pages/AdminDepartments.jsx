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
      if (editDept) {
        await departmentsApi.update(editDept._id || editDept.id, {
          name: form.name,
          description: form.description,
        });
      } else {
        await departmentsApi.create(form);
      }
      setShowModal(false);
      setEditDept(null);
      setForm({ name: "", type: activeTab, description: "" });
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
    });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditDept(null);
    setForm({ name: "", type: activeTab, description: "" });
    setShowModal(true);
  };

  const filtered = departments.filter((d) => d.type === activeTab);

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
            <Building2 size={24} /> Department Management
          </h1>
          <p className="text-slate-500">
            Create and manage departments for employees and interns
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
            {tab} Departments
          </button>
        ))}
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dept) => (
          <div
            key={dept._id || dept.id}
            className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-slate-800">
                  {dept.name}
                </h3>
                <span className="text-xs font-medium text-slate-400 uppercase">
                  {dept.type}
                </span>
              </div>
              <div className="flex gap-1">
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
              <p className="text-sm text-slate-500">{dept.description}</p>
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
            <p>No {activeTab} departments yet.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              {editDept ? "Edit Department" : "Create Department"}
            </h2>

            <div className="space-y-1">
              <label className="text-sm font-medium">Department Name</label>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Technical, Finance, Operations"
              />
            </div>

            {!editDept && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Track</label>
                <select
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="employee">Employee</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
            )}

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
