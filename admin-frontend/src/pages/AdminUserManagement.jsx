import { useEffect, useState } from "react";

import UserModal from "../components/UserModal";

import { MoreVertical, Plus, AlertCircle, Loader } from "lucide-react";
import { tasksApi, submissionsApi } from "../utils/api";

/**
 * Comprehensive user management interface for the Admin panel.
 * Displays a list of unique system users derived from tasks and submissions,
 * offering capabilities to add, edit, or delete user records.
 */
const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Retrieves tasks and submissions to dynamically extract unique user entities.
   * Maps user IDs to descriptive role strings and constructs the users table.
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const allTasks = await tasksApi.getAll();
      let allSubmissions = [];

      for (const task of allTasks) {
        try {
          const submissions = await submissionsApi.getByTask(task.id);
          allSubmissions.push(...submissions);
        } catch (err) {
          console.warn(`Could not fetch submissions for task ${task.id}`);
        }
      }

      // Extract unique users from tasks and submissions
      const userMap = new Map();

      allTasks.forEach((task) => {
        if (task.createdById) {
          userMap.set(task.createdById, {
            id: task.createdById,
            name: task.createdById.replace(/-/g, " ").toUpperCase(),
            email: `${task.createdById}@company.com`,
            role: determineRole(task.createdById),
            status: "active",
          });
        }
        if (task.assignedToId) {
          userMap.set(task.assignedToId, {
            id: task.assignedToId,
            name: task.assignedToId.replace(/-/g, " ").toUpperCase(),
            email: `${task.assignedToId}@company.com`,
            role: determineRole(task.assignedToId),
            status: "active",
          });
        }
      });

      allSubmissions.forEach((sub) => {
        if (sub.submittedById) {
          userMap.set(sub.submittedById, {
            id: sub.submittedById,
            name: sub.submittedById.replace(/-/g, " ").toUpperCase(),
            email: `${sub.submittedById}@company.com`,
            role: determineRole(sub.submittedById),
            status: "active",
          });
        }
      });

      setUsers(Array.from(userMap.values()));
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Infers a structured user role from their ID string.
   *
   * @param {string} userId - The string identifier to parse
   * @returns {string} The formatted role constant (e.g., "TEAM_LEAD", "INTERN")
   */
  const determineRole = (userId) => {
    if (userId.includes("intern")) return "INTERN";
    if (userId.includes("tl")) return "TEAM_LEAD";
    if (userId.includes("manager")) return "MANAGER";
    if (userId.includes("ceo")) return "CEO";
    if (userId.includes("cfo")) return "CFO";
    if (userId.includes("cto")) return "CTO";
    if (userId.includes("coo")) return "COO";
    if (userId.includes("admin")) return "ADMIN";
    return "USER";
  };

  /**
   * Appends a newly created user to local state.
   *
   * @param {object} user - The basic user structure returned by the creation modal
   */
  const addUser = (user) => {
    setUsers([...users, { ...user, id: Date.now() }]);
  };

  /**
   * Replaces an existing user record with updated details.
   *
   * @param {object} updated - The updated user structure
   */
  const updateUser = (updated) => {
    setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
  };

  /**
   * Removes a user from the system array based on their ID.
   *
   * @param {string|number} id - The ID of the user to remove
   */
  const deleteUser = (id) => {
    setUsers(users.filter((u) => u.id !== id));
    setOpenMenuId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-500">Loading users...</p>
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
          <p className="text-slate-500">Manage system users</p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-white"
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

      {/* Table */}
      <div className="rounded-xl border border-gray-300 bg-white">
        <table className="w-full text-sm rounded-xl">
          <thead className="text-left text-slate-500 overflow-hidden">
            <tr>
              <th className="p-4">User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th className="pr-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-300">
                <td className="p-4 font-medium">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className="rounded-full border border-gray-300 bg- bg-slate-200 px-3 py-1 text-xs font-medium">
                    {u.role}
                  </span>
                </td>
                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      u.status === "active"
                        ? "bg-green-100 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>

                {/* Actions Dropdown */}
                <td className="pr-6 text-right relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === u.id ? null : u.id)
                    }
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenuId === u.id && (
                    <div className="absolute right-6 mt-2 w-32 rounded-lg border border-gray-300 bg-white z-20 shadow">
                      <button
                        onClick={() => {
                          setEditUser(u);
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAdd && (
        <UserModal
          title="Add User"
          user={{
            name: "",
            email: "",
            role: "INTERN",
            status: "active",
          }}
          onClose={() => setShowAdd(false)}
          onSave={addUser}
        />
      )}

      {editUser && (
        <UserModal
          title="Edit User"
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={updateUser}
        />
      )}
    </div>
  );
};

export default AdminUserManagement;
