import { useEffect, useState } from "react";

import UserModal from "../components/UserModal";

import { MoreVertical, Plus, AlertCircle, Loader, Key } from "lucide-react";
import { usersApi } from "../utils/api";

// Restricted roles logic removed as per user request to allow full management of all accounts.

/**
 * Comprehensive user management interface for the Admin panel.
 */
const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(null); // stores user id
  const [newPassword, setNewPassword] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Retrieves users directly from the database API.
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Creates a new user in the database.
   */
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

  /**
   * Deletes a user from the system.
   */
  const deleteUser = async (id) => {
    try {
      setError(null);
      await usersApi.delete(id);
      setUsers(users.filter((u) => u.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      setError(err.message || "Failed to delete user");
    }
  };

  /**
   * Updates a user's password.
   */
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-500 text-sm">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-slate-500">Manage system users and credentials</p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-white text-sm font-medium hover:bg-slate-800"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-300 bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 bg-slate-50 border-b border-gray-300">
            <tr>
              <th className="p-4 font-semibold">User</th>
              <th className="font-semibold">Email</th>
              <th className="font-semibold">Role</th>
              <th className="pr-6 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => {
              return (
                <tr key={u.id} className="border-t border-gray-300 hover:bg-slate-50">
                  <td className="p-4 font-medium">{u.name || "N/A"}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="rounded-full border border-gray-300 bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">
                      {u.role?.replace(/_/g, " ")}
                    </span>
                  </td>

                  {/* Actions Dropdown */}
                  <td className="pr-6 text-right relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === u.id ? null : u.id)
                      }
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuId === u.id && (
                      <div className="absolute right-6 mt-1 w-48 rounded-lg border border-gray-300 bg-white z-20 shadow-lg py-1">
                        <button
                          onClick={() => {
                            setShowPasswordModal(u.id);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <Key size={14} /> Change Password
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                        >
                          Delete User
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAdd && (
        <UserModal
          title="Add System User"
          user={{
            name: "",
            email: "",
            role: "intern",
            status: "active",
          }}
          onClose={() => setShowAdd(false)}
          onSave={addUser}
        />
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Key size={18} /> Reset Password
            </h2>
            <div className="space-y-1">
              <label className="text-sm font-medium">New Password</label>
              <input
                type="password"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 text-sm font-medium">
              <button
                onClick={() => {
                  setShowPasswordModal(null);
                  setNewPassword("");
                }}
                className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
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
