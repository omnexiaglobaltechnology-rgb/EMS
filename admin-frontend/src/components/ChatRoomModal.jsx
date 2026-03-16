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
    const userIds = users.map((u) => u.id || u._id);
    const allSelected = userIds.every((id) => selectedUserIds.has(String(id)));

    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        userIds.forEach((id) => next.delete(String(id)));
      } else {
        userIds.forEach((id) => next.add(String(id)));
      }
      return next;
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      ceo: "bg-purple-500/30 text-purple-400 border-purple-500/30",
      cto: "bg-blue-500/30 text-blue-400 border-blue-500/30",
      cfo: "bg-green-500/30 text-green-400 border-green-500/30",
      coo: "bg-orange-500/30 text-orange-400 border-orange-500/30",
      admin: "bg-red-500/30 text-red-400 border-red-500/30",
      manager: "bg-amber-500/30 text-amber-400 border-amber-500/30",
      manager_intern: "bg-amber-500/30 text-amber-300 border-amber-500/30",
      team_lead: "bg-blue-500/30 text-[#00d4ff] border-blue-500/30 shadow-[0_0_10px_rgba(0,212,255,0.2)]",
      team_lead_intern: "bg-blue-500/30 text-blue-300 border-blue-500/30",
      intern: "bg-white/30 text-white/40 border-white/30",
    };
    return colors[role] || "bg-white/30 text-white/40 border-white/30";
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
          .filter((u) => selectedUserIds.has(String(u.id || u._id)))
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
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl rounded-3xl glass-dark shadow-2xl flex flex-col max-h-[90vh] border border-white/30 overflow-hidden">
        {/* Header */}
        <div className="px-10 py-8 border-b border-white/30 bg-white/30">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
            {isEditMode ? "Modify Chat" : "Generate Chat"} <span className="text-[#00d4ff] blue-glow">Stream</span>
          </h2>
          <p className="text-[10px] text-white/40 mt-2 font-black uppercase tracking-[0.2em]">
            {isEditMode
              ? "Updating link parameters and member access"
              : "Initializing new communication protocol and entity mapping"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-transparent">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {/* Room Name */}
            <div className="space-y-2 group">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 group-focus-within:text-[#00d4ff] transition-colors">
                Link Identifier
              </label>
              <input
                required
                className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all shadow-inner"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Project Alpha Discussion"
              />
            </div>

            {/* Type + Department row */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 group-focus-within:text-[#00d4ff] transition-colors">
                  Protocol Type
                </label>
                <select
                  className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white capitalize focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all appearance-none shadow-inner"
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

              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 group-focus-within:text-[#00d4ff] transition-colors">
                  Room Department
                </label>
                <select
                  required
                  className="w-full rounded-2xl bg-white/30 border border-white/30 px-5 py-4 text-sm text-white focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all appearance-none shadow-inner"
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
                <label className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <Users size={18} className="text-[#00d4ff] blue-glow" strokeWidth={3} />
                  Authorize Entities
                </label>
                <span className="text-[10px] font-black text-[#00d4ff] bg-blue-500/30 px-4 py-2 rounded-full border border-blue-500/30 backdrop-blur-3xl shadow-[0_0_15px_rgba(0,212,255,0.1)] blue-glow">
                  {selectedUserIds.size} Linked
                </span>
              </div>

              {/* Filters Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-white/30 p-4 rounded-3xl border border-white/30">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-white/30 flex items-center gap-1.5 ml-1">
                    <Filter size={10} />
                    Filter by Department
                  </label>
                  <select
                    className="w-full rounded-xl bg-white/30 border border-white/30 px-3 py-2 text-xs text-white focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all appearance-none"
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
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Name, email..."
                      className="w-full rounded-xl bg-white/30 border border-white/30 px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#00d4ff] outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Department-wise user list */}
              <div className="border border-white/30 rounded-3xl max-h-[250px] overflow-y-auto bg-white/30 scrollbar-thin scrollbar-thumb-white/10">
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
                        selectedUserIds.has(String(u.id || u._id))
                      );
                      const someSelected =
                        !allSelected &&
                        users.some((u) => selectedUserIds.has(String(u.id || u._id)));

                      return (
                        <div key={deptId} className="border-b border-white/30 last:border-b-0">
                          {/* Department header */}
                          <div
                            className="flex items-center gap-3 px-4 py-3 bg-white/30 cursor-pointer hover:bg-white/40 transition-colors sticky top-0 z-10 backdrop-blur-md"
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
                                  ? "bg-[#00d4ff] border-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.4)]"
                                  : someSelected
                                  ? "bg-blue-500/40 border-blue-500/50"
                                  : "border-white/30 hover:border-white/50"
                              }`}
                            >
                              {(allSelected || someSelected) && (
                                <Check size={12} className="text-slate-900 font-black" />
                              )}
                            </button>

                            <span className="text-xs font-bold text-white/90 flex-1 truncate uppercase tracking-wider">
                              {getDeptName(deptId)}
                            </span>
                            <span className="text-[10px] font-black text-white/40 bg-white/30 px-2 py-1 rounded-lg border border-white/30">
                              {users.filter((u) => selectedUserIds.has(String(u.id || u._id))).length}/{users.length}
                            </span>
                          </div>

                          {/* User list */}
                          {isExpanded && (
                            <div className="divide-y divide-white/5">
                              {users.map((user) => {
                                const isSelected = selectedUserIds.has(String(user.id || user._id));
                                return (
                                  <label
                                    key={user.id || user._id}
                                    className={`flex items-center gap-4 px-6 py-3 cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-blue-600/30"
                                        : "hover:bg-white/30"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleUser(String(user.id || user._id))}
                                      className="sr-only"
                                    />
                                    <div
                                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                        isSelected
                                          ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20"
                                          : "border-white/30"
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
                                      className={`text-[9px] uppercase font-black tracking-widest px-2 py-1 rounded-full shrink-0 border border-white/30 ${getRoleBadgeColor(
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
          <div className="px-10 py-8 border-t border-white/30 flex justify-end gap-6 bg-white/30">
            <button
              type="button"
              onClick={onClose}
                className="rounded-xl px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/30 transition-all"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl blue-button px-12 py-4 text-xs font-black uppercase tracking-[0.2em] active:scale-95 disabled:opacity-50"
            >
              {loading
                ? isEditMode
                  ? "Saving Link..."
                  : "Generating link..."
                : isEditMode
                ? "Commit Changes"
                : "Initialize Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoomModal;
