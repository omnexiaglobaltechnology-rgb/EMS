import { useState, useEffect, useMemo } from "react";
import { departmentsApi, usersApi } from "../utils/api";
import { Search, ChevronDown, ChevronRight, Users, Check, Filter } from "lucide-react";

const ROOM_TYPES = ["tech_support", "announcement", "department"];

const ChatRoomModal = ({ onClose, onSave, room = null }) => {
  const isEditMode = !!room;

  const [form, setForm] = useState({
    name: room?.name || "",
    type: room?.type || "department",
    departmentId: room?.departmentId?._id || room?.departmentId || "",
  });

  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [userDeptFilter, setUserDeptFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDepts, setExpandedDepts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Fetch departments and users on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);
        const [depts, users] = await Promise.all([
          departmentsApi.getAll(),
          usersApi.getAll(),
        ]);
        setDepartments(depts);
        setAllUsers(users);

        // Expand all departments by default
        const deptIds = new Set(depts.map((d) => d.id || d._id));
        setExpandedDepts(deptIds);

        // Pre-select participants in edit mode
        if (room?.participants?.length) {
          const existingIds = new Set(
            room.participants.map((p) =>
              typeof p === "object" ? (p._id || p.id) : p
            ).map(String)
          );
          setSelectedUserIds(existingIds);
        }

        // Default user filter to the room's department if it exists
        if (room?.departmentId?._id || room?.departmentId) {
          setUserDeptFilter(room.departmentId?._id || room.departmentId);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  // Update user filter when main department changes (in create mode)
  useEffect(() => {
    if (!isEditMode && form.departmentId) {
      setUserDeptFilter(form.departmentId);
    }
  }, [form.departmentId, isEditMode]);

  // Group users by department
  const usersByDepartment = useMemo(() => {
    const grouped = {};
    const noDept = [];

    allUsers.forEach((user) => {
      const deptId = user.department?.id || null;
      if (deptId) {
        if (!grouped[deptId]) grouped[deptId] = [];
        grouped[deptId].push(user);
      } else {
        noDept.push(user);
      }
    });

    if (noDept.length > 0) {
      grouped["no_department"] = noDept;
    }

    return grouped;
  }, [allUsers]);

  // Filter users by selected department AND search query
  const filteredUsersByDepartment = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = {};

    Object.entries(usersByDepartment).forEach(([deptId, users]) => {
      // 1. Filter by Department first
      if (userDeptFilter !== "all" && userDeptFilter !== deptId) {
        return;
      }

      // 2. Filter by Search Query
      const matchedUsers = q 
        ? users.filter(
            (u) =>
              u.name?.toLowerCase().includes(q) ||
              u.email?.toLowerCase().includes(q) ||
              u.role?.toLowerCase().includes(q)
          )
        : users;

      if (matchedUsers.length > 0) {
        filtered[deptId] = matchedUsers;
      }
    });

    return filtered;
  }, [usersByDepartment, searchQuery, userDeptFilter]);

  // Department name lookup
  const getDeptName = (deptId) => {
    if (deptId === "no_department") return "No Department";
    const dept = departments.find((d) => (d.id || d._id) === deptId);
    return dept?.name || "Unknown";
  };

  const toggleDept = (deptId) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllInDept = (deptId) => {
    const users = filteredUsersByDepartment[deptId] || [];
    const userIds = users.map((u) => u.id);
    const allSelected = userIds.every((id) => selectedUserIds.has(id));

    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        userIds.forEach((id) => next.delete(id));
      } else {
        userIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      ceo: "bg-purple-100 text-purple-700",
      cto: "bg-blue-100 text-blue-700",
      cfo: "bg-green-100 text-green-700",
      coo: "bg-orange-100 text-orange-700",
      admin: "bg-red-100 text-red-700",
      manager: "bg-amber-100 text-amber-700",
      manager_intern: "bg-amber-50 text-amber-600",
      team_lead: "bg-cyan-100 text-cyan-700",
      team_lead_intern: "bg-cyan-50 text-cyan-600",
      intern: "bg-gray-100 text-gray-600",
    };
    return colors[role] || "bg-gray-100 text-gray-600";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.departmentId) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        participants: Array.from(selectedUserIds),
      };

      // In create mode, also send emails for backward compat
      if (!isEditMode) {
        const selectedEmails = allUsers
          .filter((u) => selectedUserIds.has(u.id))
          .map((u) => u.email);
        payload.emails = selectedEmails;
      }

      await onSave(payload);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditMode ? "Edit Chat Room" : "Create Chat Room"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEditMode
              ? "Update room details and manage participants"
              : "Set up a new chat room and select participants by department"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Room Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Room Name
              </label>
              <input
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Project Alpha Discussion"
              />
            </div>

            {/* Type + Department row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Type
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Room Department
                </label>
                <select
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm({ ...form, departmentId: e.target.value })
                  }
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id || d._id} value={d.id || d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* User Picker Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  Select Participants
                </label>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  {selectedUserIds.size} selected
                </span>
              </div>

              {/* Filters Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Filter size={10} />
                    Filter by Department
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={userDeptFilter}
                    onChange={(e) => setUserDeptFilter(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id || d._id} value={d.id || d._id}>
                        {d.name}
                      </option>
                    ))}
                    <option value="no_department">No Department</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Search size={10} />
                    Search Users
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name, email..."
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Department-wise user list */}
              <div className="border border-slate-200 rounded-lg max-h-[250px] overflow-y-auto shadow-inner bg-white">
                {fetchingData ? (
                  <div className="py-8 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-sm">Loading users...</p>
                  </div>
                ) : Object.keys(filteredUsersByDepartment).length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No users found in this selection</p>
                    <p className="text-xs mt-1">Try changing the department filter or search query</p>
                  </div>
                ) : (
                  Object.entries(filteredUsersByDepartment).map(
                    ([deptId, users]) => {
                      const isExpanded = expandedDepts.has(deptId);
                      const allSelected = users.every((u) =>
                        selectedUserIds.has(u.id)
                      );
                      const someSelected =
                        !allSelected &&
                        users.some((u) => selectedUserIds.has(u.id));

                      return (
                        <div key={deptId} className="border-b border-slate-100 last:border-b-0">
                          {/* Department header */}
                          <div
                            className="flex items-center gap-2 px-3 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors sticky top-0 z-10"
                            onClick={() => toggleDept(deptId)}
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} className="text-slate-500 shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="text-slate-500 shrink-0" />
                            )}

                            {/* Select all checkbox */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllInDept(deptId);
                              }}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                allSelected
                                  ? "bg-indigo-600 border-indigo-600"
                                  : someSelected
                                  ? "bg-indigo-200 border-indigo-400"
                                  : "border-slate-300 hover:border-indigo-400"
                              }`}
                            >
                              {(allSelected || someSelected) && (
                                <Check size={10} className="text-white" />
                              )}
                            </button>

                            <span className="text-xs font-bold text-slate-700 flex-1 truncate">
                              {getDeptName(deptId)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {users.filter((u) => selectedUserIds.has(u.id)).length}/{users.length}
                            </span>
                          </div>

                          {/* User list */}
                          {isExpanded && (
                            <div className="divide-y divide-slate-50">
                              {users.map((user) => {
                                const isSelected = selectedUserIds.has(user.id);
                                return (
                                  <label
                                    key={user.id}
                                    className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-indigo-50/30"
                                        : "hover:bg-slate-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleUser(user.id)}
                                      className="sr-only"
                                    />
                                    <div
                                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected
                                          ? "bg-indigo-600 border-indigo-600"
                                          : "border-slate-300"
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check size={10} className="text-white" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-slate-800 truncate">
                                        {user.name || user.username || "Unnamed"}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {user.email}
                                      </p>
                                    </div>

                                    <span
                                      className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${getRoleBadgeColor(
                                        user.role
                                      )}`}
                                    >
                                      {user.role?.replace("_", " ")}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                ? "Save Changes"
                : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoomModal;
