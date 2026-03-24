import { useEffect, useState, useCallback } from "react";
import UserModal from "../components/UserModal";
import { MoreVertical, Plus, AlertCircle, Loader, Key, Search, Users, GraduationCap } from "lucide-react";
import { usersApi } from "../utils/api";

/**
 * Comprehensive user management interface for the Admin panel with Hierarchy support.
 */
const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("employee"); // "employee" or "intern"
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUsers = useCallback(async () => {
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
  }, [activeTab, searchTerm]);

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
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage {activeTab}s and their hierarchy</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus size={16} />
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
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab("employee")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "employee"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users size={16} /> Employees
        </button>
        <button
          onClick={() => setActiveTab("intern")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "intern"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <GraduationCap size={16} /> Interns
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold">User / ID</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold">Supervisor</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    <Loader className="mx-auto mb-2 h-8 w-8 animate-spin" />
                    <p>Loading {activeTab}s...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    No {activeTab}s found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{u.name || "N/A"}</div>
                      <div className="text-xs text-slate-500 font-mono">{u.username || u.email}</div>
                    </td>
                    <td className="p-4">
                      {u.department ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {u.department.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not Assigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.reportsTo ? (
                        <div>
                          <div className="font-medium text-slate-700">{u.reportsTo.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {u.reportsTo.role?.replace(/_/g, " ")}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-slate-100 text-slate-600 border border-slate-200">
                        {u.role?.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-4 text-right relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                        className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenuId === u.id && (
                        <div className="absolute right-4 mt-2 w-48 rounded-lg border border-slate-200 bg-white z-20 shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                          <button
                            onClick={() => {
                              setShowPasswordModal(u.id);
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            <Key size={14} /> Reset Password
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 font-medium"
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key size={18} className="text-indigo-600" /> Reset User Password
            </h2>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">New Password</label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new secure password"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 text-sm font-medium">
              <button
                onClick={() => {
                  setShowPasswordModal(null);
                  setNewPassword("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
