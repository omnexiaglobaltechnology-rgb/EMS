import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  Users,
  X,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2,
  ChevronDown,
  Copy,
  Check,
  Video,
} from "lucide-react";
import { useSelector } from "react-redux";
import { meetingsApi, departmentsApi } from "../utils/api";

/**
 * Unified Meeting Management component for all roles with Premium Glassmorphism UI.
 */
const MeetingManagement = () => {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: 30,
    invitees: [],
  });

  // Invitee Selection State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [depts, setDepts] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const isRestrictedRole = [
    "team_lead",
    "team_lead_intern",
    "manager",
    "manager_intern",
  ].includes(auth?.role);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await meetingsApi.getAll();
      const userId = auth?.id;
      
      const filtered = data.filter(m => {
        const organizerId = m.creatorId?._id || m.creatorId?.id || m.creatorId || m.organizerId;
        const isOrganizer = organizerId === userId;
        const isParticipant = m.invitees?.some(p => (p._id || p.id || p) === userId) || 
                              m.participants?.some(p => (p._id || p.id || p) === userId);
        return isOrganizer || isParticipant || auth?.role === 'ceo';
      });

      setMeetings(filtered);
    } catch {
      setError("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const handleSearchInvitees = useCallback(async () => {
    if (!searchQuery && !selectedDept && !selectedRole) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await meetingsApi.searchInvitees({
        search: searchQuery,
        departmentId: selectedDept,
        role: selectedRole,
      });
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, selectedDept, selectedRole]);

  const fetchDepts = useCallback(async () => {
    try {
      const data = await departmentsApi.getAll();
      setDepts(data);
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
    fetchDepts();
    if (isRestrictedRole && auth?.departmentId) {
      setSelectedDept(auth.departmentId);
    }
  }, [auth, fetchMeetings, fetchDepts, isRestrictedRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchInvitees();
    }, 400);
    return () => clearTimeout(timer);
  }, [handleSearchInvitees]);

  const addInvitee = (user) => {
    if (form.invitees.some((i) => i.id === (user.id || user._id))) return;
    setForm((prev) => ({
      ...prev,
      invitees: [
        ...prev.invitees,
        { id: user.id || user._id, name: user.name, username: user.username },
      ],
    }));
  };

  const addAllFromSearch = () => {
    const newInvitees = [...form.invitees];
    searchResults.forEach((user) => {
      const id = user.id || user._id;
      if (!newInvitees.some((inv) => inv.id === id)) {
        newInvitees.push({ id, name: user.name, username: user.username });
      }
    });
    setForm((prev) => ({ ...prev, invitees: newInvitees }));
  };

  const removeInvitee = (userId) => {
    setForm((prev) => ({
      ...prev,
      invitees: prev.invitees.filter((i) => i.id !== userId),
    }));
  };

  const handleCreate = async () => {
    if (!form.title || !form.date || !form.time) {
      setError("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`);
      await meetingsApi.create({
        ...form,
        scheduledAt,
        invitees: form.invitees.map((i) => i.id),
      });
      setShowModal(false);
      resetForm();
      fetchMeetings();
    } catch (err) {
      setError(err.message || "Failed to create meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      date: "",
      time: "",
      duration: 30,
      invitees: [],
    });
    setSearchQuery("");
    setSearchResults([]);
    setSelectedDept("");
    setSelectedRole("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to cancel this meeting?")) return;
    try {
      await meetingsApi.delete(id);
      fetchMeetings();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.message || "Failed to delete meeting");
    }
  };

  const handleCopyInvitation = (m) => {
    const link = m.link || m.id || m._id;
    const inviteText = `Meeting Invitation: ${m.title}
Date: ${formatMeetingDate(m)}
Time: ${formatMeetingTime(m)}
Meeting ID: ${link}
Created by: ${m.creatorId?.name || "Admin"} (${m.creatorId?.role?.replace(/_/g, " ").toUpperCase() || "Support"})

Join the meeting at: ${window.location.origin}/${auth.role}/meeting-room/${link}`;

    navigator.clipboard.writeText(inviteText);
    setCopiedId(m.id || m._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMeetingDate = (m) => {
    if (m.date)
      return new Date(m.date).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    if (m.scheduledAt)
      return new Date(m.scheduledAt).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    return "No Date Set";
  };

  const formatMeetingTime = (m) => {
    if (m.time) return m.time;
    if (m.scheduledAt)
      return new Date(m.scheduledAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    return "No Time Set";
  };

  return (
    <div className="p-6 space-y-10 min-h-screen animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">Meeting Management</h1>
          <p className="text-base text-slate-300 font-bold mt-2 leading-relaxed max-w-2xl opacity-80">Schedule, coordinate, and sync with your team effortlessly.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] font-bold active:scale-95"
        >
          <Plus size={20} />
          Schedule Meeting
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex items-center gap-3 text-red-400 animate-in shake duration-500">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-white/10 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Meetings Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="animate-spin mb-4 h-12 w-12 text-indigo-500" />
          <p className="text-lg font-medium animate-pulse">
            Syncing schedules...
          </p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10">
          <Calendar className="mx-auto h-16 w-16 text-slate-700 mb-4 opacity-30" />
          <p className="text-slate-500 font-bold text-xl">
            No meetings scheduled for now.
          </p>
          <p className="text-slate-600 text-sm mt-2">
            Get started by creating a new meeting invitation.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((m) => (
            <div
              key={m.id || m._id}
              className="group flex flex-col rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:shadow-indigo-500/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-300">
                {(auth?.id === (m.creatorId?._id || m.creatorId?.id || m.creatorId) || auth?.role === 'ceo') && (
                  <button
                    onClick={() => handleDelete(m._id || m.id)}
                    className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <span
                    className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      m.status === "scheduled"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : m.status === "completed"
                          ? "bg-slate-800 text-slate-400"
                          : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {m.status}
                  </span>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    BYID: {m.link || (m.id || m._id).slice(-6)}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-white line-clamp-2 leading-tight mb-4 group-hover:text-indigo-300 transition-colors">
                  {m.title}
                </h3>

                <div className="mb-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-sm font-black text-indigo-400 border border-indigo-500/20 shadow-inner">
                    {m.creatorId?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white leading-none">
                      {m.creatorId?.name || "System Admin"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                      {m.creatorId?.role?.replace(/_/g, " ") || "Admin"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <Calendar size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-200">
                      {formatMeetingDate(m)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <Clock size={18} />
                    </div>
                    <span className="text-slate-200">
                      {formatMeetingTime(m)}
                    </span>
                    <span className="text-white/10">|</span>
                    <span className="text-slate-400 font-medium">
                      {m.duration} min
                    </span>
                  </div>
                </div>

                {m.description && (
                  <p className="mt-6 text-xs text-slate-500 line-clamp-3 italic font-semibold px-2 leading-relaxed">
                    &quot;{m.description}&quot;
                  </p>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <button
                  onClick={() => handleCopyInvitation(m)}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all shadow-sm group/btn"
                >
                  {copiedId === (m.id || m._id) ? (
                    <>
                      <Check size={16} className="text-emerald-400" />
                      <span className="text-emerald-400">
                        Copied Invitation
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy
                        size={16}
                        className="group-hover/btn:text-indigo-400 transition-colors"
                      />
                      <span>Copy Full Invitation</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3 shrink-0">
                    {m.invitees?.slice(0, 3).map((inv, idx) => (
                      <div
                        key={idx}
                        className="h-12 w-12 rounded-2xl bg-slate-800 border-2 border-[#1e293b] flex items-center justify-center text-[10px] font-black text-slate-400 uppercase ring-1 ring-white/5 shadow-xl"
                      >
                        {inv.name?.charAt(0) || "U"}
                      </div>
                    ))}
                    {m.invitees?.length > 3 && (
                      <div className="h-12 w-12 rounded-2xl bg-indigo-600 border-2 border-[#1e293b] flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                        +{m.invitees.length - 3}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      navigate(
                        `/${auth.role}/meeting-room/${m.link || m.id || m._id}`,
                      )
                    }
                    className="flex-1 bg-indigo-600 h-12 rounded-2xl text-sm font-black text-white hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 active:scale-95"
                  >
                    <Video size={18} />
                    Join Room
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-6xl max-h-[90vh] rounded-[48px] bg-[#0f172a] shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-white/5 px-12 py-10 bg-white/5">
              <div>
                <h2 className="text-3xl font-black text-white leading-tight">
                  Create Meeting
                </h2>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-2">
                  Enterprise Meeting Scheduler
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-4 hover:bg-white/10 rounded-3xl transition-all text-slate-400 hover:text-white group"
              >
                <X
                  size={28}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 custom-scrollbar">
              {/* Left Column: Details */}
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block px-2">Meeting Title</label>
                  <input
                    placeholder="e.g. Quarterly Strategy Meeting"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-lg focus:bg-white/10 focus:border-indigo-500 transition-all outline-none font-black text-white placeholder:text-slate-700 shadow-xl"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block px-2">Date Selection</label>
                    <input
                      type="date"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base focus:bg-white/10 focus:border-indigo-500 transition-all outline-none font-black text-white [color-scheme:dark] shadow-lg"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block px-2">Start Time</label>
                    <input
                      type="time"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base focus:bg-white/10 focus:border-indigo-500 transition-all outline-none font-black text-white [color-scheme:dark] shadow-lg"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block px-2">Duration</label>
                      <div className="relative group">
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm focus:bg-white/10 focus:border-indigo-500 transition-all outline-none font-black text-white appearance-none cursor-pointer shadow-lg"
                          value={form.duration}
                          onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                        >
                          <option className="bg-[#0f172a] p-4" value={15}>15 Minutes</option>
                          <option className="bg-[#0f172a] p-4" value={30}>30 Minutes</option>
                          <option className="bg-[#0f172a] p-4" value={45}>45 Minutes</option>
                          <option className="bg-[#0f172a] p-4" value={60}>1 Hour</option>
                          <option className="bg-[#0f172a] p-4" value={120}>2 Hours</option>
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                      </div>
                    </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block px-2">Agenda & Description</label>
                  <textarea
                    placeholder="Briefly describe the purpose"
                    className="w-full h-32 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm focus:bg-white/10 focus:border-indigo-500 transition-all outline-none font-bold text-white resize-none placeholder:text-slate-700 shadow-lg"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Column: Invitees */}
              <div className="lg:col-span-5 flex flex-col bg-white/5 rounded-[40px] border border-white/5 p-10 space-y-8">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                      Invite Participants
                    </label>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                      {form.invitees.length} users selected for this session
                    </p>
                  </div>
                  <div className="flex -space-x-3">
                    {form.invitees.slice(0, 4).map((i, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-10 rounded-2xl bg-slate-800 border-2 border-[#1e293b] flex items-center justify-center text-[10px] font-black text-indigo-300 shadow-xl"
                      >
                        {i.name?.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Area */}
                <div className="flex flex-wrap gap-2.5 py-6 border-b border-white/5 min-h-[80px]">
                  {form.invitees.map((i) => (
                    <span
                      key={i.id}
                      className="inline-flex items-center gap-2 pl-4 pr-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[10px] font-black text-indigo-300 shadow-lg animate-in zoom-in-95"
                    >
                      {i.name}
                      <button
                        onClick={() => removeInvitee(i.id)}
                        className="text-indigo-400/50 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {form.invitees.length === 0 && (
                    <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic py-4">
                      No participants added yet
                    </p>
                  )}
                </div>

                {/* Search & Filter */}
                <div className="space-y-6">
                  <div className="relative group">
                    <Search
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors"
                      size={18}
                    />
                    <input
                      placeholder="Find people by name..."
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-14 py-4 text-xs outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 font-bold text-white transition-all shadow-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <select
                        className="w-full rounded-2xl border border-white/10 bg-white/5 pl-5 pr-10 py-4 text-[10px] font-black text-slate-300 outline-none appearance-none cursor-pointer focus:border-indigo-500"
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        disabled={isRestrictedRole}
                      >
                        {!isRestrictedRole && (
                          <option className="bg-[#1e293b]" value="">
                            All Departments
                          </option>
                        )}
                        {depts.map((d) => (
                          <option
                            className="bg-[#1e293b]"
                            key={d.id || d._id}
                            value={d.id || d._id}
                            disabled={
                              isRestrictedRole &&
                              d.id !== auth?.departmentId &&
                              d._id !== auth?.departmentId
                            }
                          >
                            {d.name.toUpperCase()}{" "}
                            {isRestrictedRole &&
                            (d.id === auth?.departmentId ||
                              d._id === auth?.departmentId)
                              ? "(YOURS)"
                              : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                        size={14}
                      />
                    </div>

                    <div className="relative group">
                      <select
                        className="w-full rounded-2xl border border-white/10 bg-white/5 pl-5 pr-10 py-4 text-[10px] font-black text-slate-300 outline-none appearance-none cursor-pointer focus:border-indigo-500"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option className="bg-[#1e293b]" value="">
                          All Roles
                        </option>
                        <option className="bg-[#1e293b]" value="manager">
                          MANAGERS
                        </option>
                        <option className="bg-[#1e293b]" value="team_lead">
                          TEAM LEADS
                        </option>
                        <option className="bg-[#1e293b]" value="intern">
                          EMPLOYEES
                        </option>
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                        size={14}
                      />
                    </div>
                  </div>
                </div>

                {/* Results List */}
                <div className="flex-1 flex flex-col min-h-0 bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-xl">
                   <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between text-[10px] font-black tracking-widest text-slate-500 uppercase bg-white/5">
                      <span>Database Results</span>
                      {searchResults.length > 0 && (
                        <button 
                          onClick={addAllFromSearch}
                          className="text-indigo-400 hover:text-white font-black cursor-pointer bg-indigo-500/10 px-4 py-1.5 rounded-xl transition-all active:scale-95"
                        >
                          Select All ({searchResults.length})
                        </button>
                      )}
                   </div>
                   <div className="flex-1 overflow-y-auto divide-y divide-white/10 custom-scrollbar">
                      {searching ? (
                        <div className="p-10 text-center"><Loader2 size={32} className="animate-spin mx-auto text-indigo-500/40" /></div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-16 text-center">
                            <Users className="mx-auto text-slate-800 mb-4 opacity-30" size={56} />
                            <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">No users detected</p>
                        </div>
                      ) : (
                        searchResults.map(user => (
                          <div key={user.id || user._id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-base text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg border border-white/5">
                                    {user.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-white leading-none group-hover:text-indigo-300 transition-colors">{user.name}</p>
                                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter mt-1">{user.role?.replace(/_/g, " ")} • {user.departmentName}</p>
                                </div>
                            </div>
                            <button 
                              onClick={() => addInvitee(user)}
                              className="p-3 bg-white/5 text-slate-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 bg-white/5 px-12 py-10 flex justify-end gap-6">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-2xl border border-white/10 bg-transparent px-10 py-4 text-xs font-black text-slate-500 hover:bg-white/5 transition-all"
              >
                DISCARD CHANGES
              </button>
              <button
                disabled={submitting}
                onClick={handleCreate}
                className="flex items-center gap-3 rounded-2xl bg-indigo-600 px-16 py-4 text-xs font-black text-white hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-500/20 disabled:opacity-50 active:scale-95"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                FINALIZE SCHEDULE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingManagement;
