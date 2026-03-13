import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Calendar, Users, X, Search, Clock, 
  ChevronRight, CheckCircle2, AlertCircle, Trash2, 
  MapPin, Loader2, ChevronDown, Filter, Link, Copy, Check, Video
} from "lucide-react";
import { useSelector } from "react-redux";
import { meetingsApi, departmentsApi } from "../utils/api";

/**
 * Unified Meeting Management component for all roles.
 * Handles scheduling, invitee management, and hierarchical user selection.
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

  const isRestrictedRole = ['team_lead', 'team_lead_intern', 'manager', 'manager_intern'].includes(auth?.role);

  useEffect(() => {
    fetchMeetings();
    fetchDepts();
    if (isRestrictedRole && auth?.departmentId) {
      setSelectedDept(auth.departmentId);
    }
  }, [auth]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const data = await meetingsApi.getAll();
      setMeetings(data);
    } catch (err) {
      setError("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepts = async () => {
    try {
      const data = await departmentsApi.getAll();
      setDepts(data);
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  const handleSearchInvitees = async () => {
    if (!searchQuery && !selectedDept && !selectedRole) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await meetingsApi.searchInvitees({
        search: searchQuery,
        departmentId: selectedDept,
        role: selectedRole
      });
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchInvitees();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedDept, selectedRole]);

  const addInvitee = (user) => {
    if (form.invitees.some(i => i.id === (user.id || user._id))) return;
    setForm(prev => ({
      ...prev,
      invitees: [...prev.invitees, { id: user.id || user._id, name: user.name, username: user.username }]
    }));
  };

  const removeInvitee = (userId) => {
    setForm(prev => ({
      ...prev,
      invitees: prev.invitees.filter(i => i.id !== userId)
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
        invitees: form.invitees.map(i => i.id)
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
    setForm({ title: "", description: "", date: "", time: "", duration: 30, invitees: [] });
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
      alert("Failed to delete meeting");
    }
  };

  const handleCopyLink = (m) => {
    const link = m.link || m.id || m._id;
    navigator.clipboard.writeText(link);
    setCopiedId(m.id || m._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meeting Management</h1>
          <p className="text-sm text-slate-500 font-medium">Schedule and coordinate with your team across hierarchy</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-semibold"
        >
          <Plus size={18} />
          Schedule Meeting
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-800 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Meetings Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-3" size={32} />
          <p className="text-sm font-medium">Fetching scheduled meetings...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <Calendar className="mx-auto h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No meetings scheduled for now.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((m) => (
            <div
              key={m.id || m._id}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(m.id || m._id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    m.status === "scheduled" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    m.status === "completed" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"
                  }`}>
                    {m.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight mb-4 group-hover:text-indigo-600 transition-colors">
                  {m.title}
                </h3>

                <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
                      <Calendar size={14} />
                    </div>
                    {new Date(m.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
                      <Clock size={14} />
                    </div>
                    {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({m.duration} min)
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
                      <Users size={14} />
                    </div>
                    {m.invitees?.length || 0} Participants Invited
                  </div>
                </div>
                
                {m.description && (
                  <p className="mt-4 text-xs text-slate-400 line-clamp-2 italic">
                    {m.description}
                  </p>
                )}

                {m.link && (
                  <div className="mt-4 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Link size={12} className="text-indigo-500 shrink-0" />
                      <span className="text-[10px] font-mono text-slate-600 truncate">{m.link}</span>
                    </div>
                    <button 
                      onClick={() => handleCopyLink(m)}
                      className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all"
                      title="Copy Link"
                    >
                      {copiedId === (m.id || m._id) ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                 <div className="flex -space-x-2">
                  {m.invitees?.slice(0, 3).map((inv, idx) => (
                    <div key={idx} className="h-7 w-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                      {inv.name?.charAt(0) || "U"}
                    </div>
                  ))}
                  {m.invitees?.length > 3 && (
                    <div className="h-7 w-7 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      +{m.invitees.length - 3}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    const rolePath = auth.role === 'ceo' ? 'ceo-meeting-rooms' : 
                                   auth.role === 'manager' ? 'meeting-room' :
                                   auth.role === 'team_lead' ? 'tl-meeting-room' :
                                   auth.role === 'intern' ? 'intern-meeting-room' : 'meeting-room';
                    navigate(`/${auth.role}/${rolePath}/${m.id || m._id}`);
                  }}
                  className="flex-1 bg-indigo-600 border border-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Video size={14} />
                  Join Room
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden border border-white/20 scale-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Schedule Team Sync</h2>
                <p className="text-xs text-slate-500 font-medium">Create a new meeting and invite participants</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left Column: Details */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Meeting Title</label>
                  <input
                    placeholder="e.g. Q1 Tech Review"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-4 focus:border-indigo-500 ring-indigo-500/5 transition-all outline-none font-medium"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Date</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-4 focus:border-indigo-500 ring-indigo-500/5 transition-all outline-none font-medium"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Time</label>
                    <input
                      type="time"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-4 focus:border-indigo-500 ring-indigo-500/5 transition-all outline-none font-medium"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Duration (Minutes)</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-4 focus:border-indigo-500 ring-indigo-500/5 transition-all outline-none font-medium bg-white"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Agenda / Description</label>
                  <textarea
                    placeholder="What's this meeting about?"
                    className="w-full h-32 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-4 focus:border-indigo-500 ring-indigo-500/5 transition-all outline-none font-medium resize-none"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Column: Invitees */}
              <div className="flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Participants</label>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">{form.invitees.length} Selected</span>
                </div>

                {/* Selected Badges */}
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {form.invitees.map((i) => (
                    <span key={i.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm animate-in zoom-in-95">
                      {i.name}
                      <button onClick={() => removeInvitee(i.id)} className="text-slate-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {form.invitees.length === 0 && <p className="text-xs text-slate-400 italic">No participants added yet</p>}
                </div>

                {/* Search & Filter */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      placeholder="Search by name or username..."
                      className="w-full rounded-xl border border-slate-200 px-9 py-2.5 text-xs outline-none focus:ring-2 ring-indigo-500/10 font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                      <select 
                        className="w-full rounded-lg border border-slate-200 pl-8 pr-2 py-2 text-[10px] font-bold text-slate-600 outline-none appearance-none bg-white"
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                      >
                        <option value="">All Depts</option>
                        {depts.map(d => (
                          <option key={d.id || d._id} value={d.id || d._id} disabled={isRestrictedRole && d.id !== user?.departmentId && d._id !== user?.departmentId}>
                            {d.name} {isRestrictedRole && (d.id === user?.departmentId || d._id === user?.departmentId) ? "(Your Dept)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <select 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 outline-none appearance-none bg-white"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="">All Roles</option>
                      <option value="manager">Managers</option>
                      <option value="team_lead">Team Leads</option>
                      <option value="intern">Employees/Interns</option>
                    </select>
                  </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto max-h-40 bg-white rounded-xl border border-slate-200 divide-y divide-slate-50">
                  {searching ? (
                    <div className="p-4 text-center"><Loader2 size={16} className="animate-spin mx-auto text-slate-300" /></div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">Use filters to find users</div>
                  ) : (
                    searchResults.map(user => (
                      <div key={user.id || user._id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-slate-700 leading-tight">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{user.role?.replace(/_/g, " ")} • {user.departmentName}</p>
                        </div>
                        <button 
                          onClick={() => addInvitee(user)}
                          className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/80 px-8 py-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleCreate}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingManagement;
