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
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader className="mx-auto mb-6 h-12 w-12 animate-spin text-[#00fbff] cyan-glow" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Infrastructure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Building2 size={28} className="text-indigo-400" /> Department Management
          </h1>
          <p className="text-white/60 font-medium">
            Create and manage departments for employees and interns
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-3 rounded-xl cyan-button px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          Initialize Dept
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/30 p-5 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-200 font-medium">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/30 p-1.5 w-fit border border-white/30 backdrop-blur-md">
        {["employee", "intern"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab
                ? "bg-white/40 text-[#00fbff] shadow-[0_0_15px_rgba(0,251,255,0.2)] border border-white/30 cyan-glow"
                : "text-white/40 hover:text-white"
            }`}
          >
            {tab}s
          </button>
        ))}
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dept) => (
          <div
            key={dept._id || dept.id}
            className="card-glass p-6 space-y-4 group hover:border-white/30 transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-2xl text-white group-hover:text-[#00fbff] transition-all duration-500 tracking-tighter">
                  {dept.name}
                </h3>
                <span className="text-[10px] font-black text-[#00fbff] uppercase tracking-[0.2em] cyan-glow mt-1 block">
                  {dept.type} PROTOCOL
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(dept)}
                  className="p-2 rounded-xl bg-white/30 hover:bg-white/40 text-white/40 hover:text-white transition-all border border-white/30"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(dept._id || dept.id)}
                  className="p-2 rounded-xl bg-white/30 hover:bg-red-500/30 text-white/40 hover:text-red-400 transition-all border border-white/30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {dept.description && (
              <p className="text-sm text-white/60 leading-relaxed">{dept.description}</p>
            )}
            <div className="flex items-center gap-2 pt-4 border-t border-white/30">
              <div className="p-1.5 rounded-lg bg-white/30">
                <Users size={12} className="text-white/30" />
              </div>
              <span className="text-xs font-bold text-white/30 uppercase tracking-wider">
                Managed by {dept.createdBy?.name || "System"}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white/30 rounded-3xl border-2 border-dashed border-white/30">
            <Building2 className="mx-auto mb-4 h-16 w-16 text-white/5" />
            <p className="text-white/40 font-bold text-lg">No {activeTab} departments yet</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl glass-dark p-8 space-y-6 shadow-2xl border border-white/30">
            <h2 className="text-2xl font-bold text-white">
              {editDept ? "Edit Dept" : "New Dept"}
            </h2>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Department Name</label>
              <input
                className="w-full rounded-xl bg-white/30 border border-white/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#00fbff] outline-none transition-all"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Technical, Finance, Operations"
              />
            </div>

            {!editDept && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Track</label>
                <select
                  className="w-full rounded-xl bg-white/30 border border-white/30 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-[#00fbff] outline-none transition-all appearance-none cursor-pointer"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="employee" className="bg-slate-900">Employee</option>
                  <option value="intern" className="bg-slate-900">Intern</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Description</label>
              <textarea
                className="w-full rounded-xl bg-white/30 border border-white/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#00fbff] outline-none transition-all"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Explain the department's focus..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditDept(null);
                }}
                className="rounded-xl px-6 py-3 text-sm font-bold text-white/60 hover:text-white hover:bg-white/30 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-2xl cyan-button px-10 py-4 text-xs font-black uppercase tracking-[0.2em] active:scale-95"
              >
                {editDept ? "Commit Changes" : "Initialize Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartments;
