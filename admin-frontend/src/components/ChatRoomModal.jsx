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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl rounded-3xl glass-dark shadow-2xl flex flex-col max-h-[90vh] border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 bg-white/5">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isEditMode ? "Edit Chat Room" : "Create Chat Room"}
          </h2>
          <p className="text-sm text-white/50 mt-1 font-medium">
            {isEditMode
              ? "Update room details and manage participants"
              : "Set up a new chat room and select participants by department"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-transparent">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {/* Room Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">
                Room Name
              </label>
              <input
                required
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Project Alpha Discussion"
              />
            </div>

            {/* Type + Department row */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">
                  Type
                </label>
                <select
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white capitalize focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-slate-900">
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">
                  Room Department
                </label>
                <select
                  required
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm({ ...form, departmentId: e.target.value })
                  }
                >
                  <option value="" className="bg-slate-900">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id || d._id} value={d.id || d._id} className="bg-slate-900">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* User Picker Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-indigo-400" />
                  Select Participants
                </label>
                <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 backdrop-blur-md">
                  {selectedUserIds.size} selected
                </span>
              </div>

              {/* Filters Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-white/5 p-4 rounded-3xl border border-white/10">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-white/30 flex items-center gap-1.5 ml-1">
                    <Filter size={10} />
                    Filter by Department
                  </label>
                  <select
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                    value={userDeptFilter}
                    onChange={(e) => setUserDeptFilter(e.target.value)}
                  >
                    <option value="all" className="bg-slate-900">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id || d._id} value={d.id || d._id} className="bg-slate-900">
                        {d.name}
                      </option>
                    ))}
                    <option value="no_department" className="bg-slate-900">No Department</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-white/30 flex items-center gap-1.5 ml-1">
                    <Search size={10} />
                    Search Users
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name, email..."
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Department-wise user list */}
              <div className="border border-white/10 rounded-3xl max-h-[250px] overflow-y-auto bg-white/5 scrollbar-thin scrollbar-thumb-white/10">
                {fetchingData ? (
                  <div className="py-12 text-center text-white/30">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-3"></div>
                    <p className="text-sm font-medium">Loading users...</p>
                  </div>
                ) : Object.keys(filteredUsersByDepartment).length === 0 ? (
                  <div className="py-16 text-center text-white/20">
                    <Users size={40} className="mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-bold">No users found</p>
                    <p className="text-xs mt-1">Refine your filters or search</p>
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
                        <div key={deptId} className="border-b border-white/5 last:border-b-0">
                          {/* Department header */}
                          <div
                            className="flex items-center gap-3 px-4 py-3 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors sticky top-0 z-10 backdrop-blur-md"
                            onClick={() => toggleDept(deptId)}
                          >
                            {isExpanded ? (
                              <ChevronDown size={16} className="text-white/40 shrink-0" />
                            ) : (
                              <ChevronRight size={16} className="text-white/40 shrink-0" />
                            )}

                            {/* Select all checkbox */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllInDept(deptId);
                              }}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                allSelected
                                  ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20"
                                  : someSelected
                                  ? "bg-indigo-500/40 border-indigo-500/50"
                                  : "border-white/20 hover:border-white/40"
                              }`}
                            >
                              {(allSelected || someSelected) && (
                                <Check size={12} className="text-white" />
                              )}
                            </button>

                            <span className="text-xs font-bold text-white/90 flex-1 truncate uppercase tracking-wider">
                              {getDeptName(deptId)}
                            </span>
                            <span className="text-[10px] font-black text-white/40 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                              {users.filter((u) => selectedUserIds.has(u.id)).length}/{users.length}
                            </span>
                          </div>

                          {/* User list */}
                          {isExpanded && (
                            <div className="divide-y divide-white/5">
                              {users.map((user) => {
                                const isSelected = selectedUserIds.has(user.id);
                                return (
                                  <label
                                    key={user.id}
                                    className={`flex items-center gap-4 px-6 py-3 cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-indigo-500/10"
                                        : "hover:bg-white/5"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleUser(user.id)}
                                      className="sr-only"
                                    />
                                    <div
                                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                        isSelected
                                          ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20"
                                          : "border-white/20"
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check size={12} className="text-white" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-white truncate">
                                        {user.name || user.username || "Unnamed"}
                                      </p>
                                      <p className="text-[10px] text-white/40 font-medium truncate">
                                        {user.email}
                                      </p>
                                    </div>

                                    <span
                                      className={`text-[9px] uppercase font-black tracking-widest px-2 py-1 rounded-full shrink-0 border border-white/10 ${getRoleBadgeColor(
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
          <div className="px-8 py-6 border-t border-white/10 flex justify-end gap-4 bg-white/5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-6 py-3 text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-50"
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
