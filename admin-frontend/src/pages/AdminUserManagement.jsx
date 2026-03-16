import { useEffect, useState } from "react";
import UserModal from "../components/UserModal";
import { MoreVertical, Plus, AlertCircle, Loader, Key, Search, Users, GraduationCap } from "lucide-react";
import { usersApi } from "../utils/api";

/**
 * Comprehensive user management interface for the Admin panel with Hierarchy support.
 */
const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("employee"); // "employee" or "intern"
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAll({ 
        userType: activeTab,
        search: searchTerm 
      });
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const addUser = async (userData) => {
    try {
      setError(null);
      await usersApi.create(userData);
      await fetchUsers();
      setShowAdd(false);
    } catch (err) {
      setError(err.message || "Failed to add user");
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      setError(null);
      await usersApi.delete(id);
      setUsers(users.filter((u) => u.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      setError(err.message || "Failed to delete user");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    try {
      setError(null);
      await usersApi.updatePassword(showPasswordModal, newPassword);
      setShowPasswordModal(null);
      setNewPassword("");
      setOpenMenuId(null);
    } catch (err) {
      setError(err.message || "Failed to update password");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">User Management</h1>
          <p className="text-white/60 font-medium">Manage {activeTab}s and their hierarchy</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/30 border border-white/30 text-white text-sm focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all placeholder:text-white/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-3 rounded-xl blue-button px-6 py-2.5 text-xs font-black uppercase tracking-widest active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            Add User
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/30 p-1.5 w-fit border border-white/30 backdrop-blur-md">
        <button
          onClick={() => setActiveTab("employee")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "employee"
              ? "bg-white/40 text-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.2)] border border-white/30 blue-glow"
              : "text-white/40 hover:text-white"
          }`}
        >
          <Users size={16} /> Employees
        </button>
        <button
          onClick={() => setActiveTab("intern")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px) font-black uppercase tracking-widest transition-all ${
            activeTab === "intern"
              ? "bg-white/40 text-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.2)] border border-white/30 blue-glow"
              : "text-white/40 hover:text-white"
          }`}
        >
          <GraduationCap size={16} /> Interns
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-white/30 bg-white/30 overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-white/40 bg-white/30 uppercase tracking-widest text-[10px] font-black">
              <tr>
                <th className="p-6">User / ID</th>
                <th className="p-6">Department</th>
                <th className="p-6">Supervisor</th>
                <th className="p-6">Role</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-white/30">
                    <Loader className="mx-auto mb-4 h-10 w-10 animate-spin text-[#00d4ff] blue-glow" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Synchronizing {activeTab}s...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-white/20">
                    <p className="text-lg font-bold">No {activeTab}s found</p>
                    <p className="text-sm italic mt-1 text-white/10">Try a different search term</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/30 transition-colors group">
                    <td className="p-6">
                      <div className="font-bold text-white text-base">{u.name || "N/A"}</div>
                      <div className="text-xs text-white/40 font-mono mt-0.5 tracking-tight">{u.username || u.email}</div>
                    </td>
                    <td className="p-6 text-white/80">
                      {u.department ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-[#00d4ff] border border-blue-500/30 backdrop-blur-md blue-glow">
                          {u.department.name}
                        </span>
                      ) : (
                        <span className="text-white/20 italic uppercase text-[10px] font-black">Not Assigned</span>
                      )}
                    </td>
                    <td className="p-6">
                      {u.reportsTo ? (
                        <div>
                          <div className="font-black text-white text-sm uppercase tracking-tight">{u.reportsTo.name}</div>
                          <div className="text-[10px] text-[#00d4ff] uppercase font-black tracking-widest mt-0.5 blue-glow">
                            {u.reportsTo.role?.replace(/_/g, " ")}
                          </div>
                        </div>
                      ) : (
                        <span className="text-white/10">—</span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/30 text-white/40 border border-white/30">
                        {u.role?.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-6 text-right relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                        className="p-2 hover:bg-white/30 rounded-xl transition-all text-white/40 hover:text-white"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {openMenuId === u.id && (
                        <div className="absolute right-6 mt-2 w-52 rounded-2xl glass-dark z-20 shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-150 origin-top-right border border-white/30">
                          <button
                            onClick={() => {
                              setShowPasswordModal(u.id);
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-3 w-full px-5 py-3 text-left text-[10px] font-black text-white/70 hover:bg-white/30 hover:text-[#00d4ff] transition-all uppercase tracking-[0.2em] blue-glow"
                          >
                            <Key size={14} strokeWidth={3} /> Reset Password
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="flex items-center gap-3 w-full px-5 py-3 text-left text-[10px] font-black text-red-400 hover:bg-red-500/30 transition-all uppercase tracking-[0.2em]"
                          >
                            Delete User
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <UserModal
          title={`Add New ${activeTab === 'employee' ? 'Employee' : 'Intern'}`}
          user={{
            userType: activeTab,
            role: activeTab === 'employee' ? 'intern' : 'intern', // Default role for type
          }}
          onClose={() => setShowAdd(false)}
          onSave={addUser}
        />
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl glass-dark p-8 space-y-6 shadow-2xl border border-white/30">
            <h2 className="text-xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
              <Key size={22} className="text-[#00d4ff] blue-glow" strokeWidth={3} /> Reset Security Access
            </h2>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">New Password</label>
              <input
                type="password"
                className="w-full rounded-xl bg-white/30 border border-white/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowPasswordModal(null);
                  setNewPassword("");
                }}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white/60 hover:text-white hover:bg-white/30 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="rounded-xl blue-button px-8 py-3 text-[10px] font-black uppercase tracking-widest active:scale-95"
              >
                Refactor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
