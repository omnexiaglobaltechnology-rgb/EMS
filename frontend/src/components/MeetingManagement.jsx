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

  const addAllFromSearch = () => {
    const newInvitees = [...form.invitees];
    searchResults.forEach(user => {
      const id = user.id || user._id;
      if (!newInvitees.some(inv => inv.id === id)) {
        newInvitees.push({ id, name: user.name, username: user.username });
      }
    });
    setForm(prev => ({ ...prev, invitees: newInvitees }));
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

  const handleCopyInvitation = (m) => {
    const link = m.link || m.id || m._id;
    const inviteText = `Meeting Invitation: ${m.title}
Date: ${new Date(m.scheduledAt).toLocaleDateString()}
Time: ${new Date(m.scheduledAt).toLocaleTimeString()}
Meeting ID: ${link}
Created by: ${m.creatorId?.name || 'Admin'} (${m.creatorId?.role?.replace(/_/g, ' ').toUpperCase() || 'Support'})

Join the meeting at: ${window.location.origin}/${auth.role}/meeting-room/${link}`;
    
    navigator.clipboard.writeText(inviteText);
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
              className="group flex flex-col rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(m.id || m._id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    m.status === "scheduled" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    m.status === "completed" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"
                  }`}>
                    {m.status}
                  </span>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded">
                    ByID: {m.link || (m.id || m._id).slice(-6)}
                  </div>
                </div>
                
                <h3 className="text-lg font-extrabold text-slate-900 line-clamp-2 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {m.title}
                </h3>

                <div className="mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-200">
                        {m.creatorId?.name?.charAt(0) || "A"}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-900 leading-none">{m.creatorId?.name || "System Admin"}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.creatorId?.role?.replace(/_/g, " ") || "Admin"}</p>
                    </div>
                </div>

                <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-indigo-500" />
                    <span className="text-xs font-bold text-slate-700">
                        {new Date(m.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <Clock size={14} className="text-indigo-500" />
                    <span className="text-slate-700">
                        {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">{m.duration} min</span>
                  </div>
                </div>

                {m.description && (
                  <p className="mt-4 text-xs text-slate-400 line-clamp-2 italic font-medium px-1">
                    "{m.description}"
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                 <button 
                  onClick={() => handleCopyInvitation(m)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-sm"
                >
                  {copiedId === (m.id || m._id) ? (
                    <>
                      <Check size={14} className="text-emerald-500" />
                      <span className="text-emerald-600">Copied Invitation</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Full Invitation</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 shrink-0">
                      {m.invitees?.slice(0, 3).map((inv, idx) => (
                        <div key={idx} className="h-10 w-10 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-slate-500 uppercase overflow-hidden ring-1 ring-slate-100">
                          {inv.name?.charAt(0) || "U"}
                        </div>
                      ))}
                      {m.invitees?.length > 3 && (
                        <div className="h-10 w-10 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                          +{m.invitees.length - 3}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => navigate(`/${auth.role}/meeting-room/${m.link || m.id || m._id}`)}
                      className="flex-1 bg-indigo-600 border border-indigo-600 text-white font-black h-10 rounded-2xl text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
                    >
                      <Video size={16} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[95vh] rounded-[40px] bg-white shadow-2xl flex flex-col overflow-hidden border border-white/20 scale-100">
             <div className="flex items-center justify-between border-b border-slate-100 px-10 py-8 bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-none">Create Meeting</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Professional Scheduler</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400 group">
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Details */}
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">Meeting Title</label>
                  <input
                    placeholder="e.g. Quarterly Strategy Meeting"
                    className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 py-4 text-sm focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-800 placeholder:font-medium"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">Date</label>
                    <input
                      type="date"
                      className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 py-4 text-sm focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-800"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">Time</label>
                    <input
                      type="time"
                      className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 py-4 text-sm focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-800"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">Duration</label>
                      <select
                        className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 py-4 text-sm focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-800 bg-white"
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
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">Agenda</label>
                  <textarea
                    placeholder="Briefly describe the purpose of this call"
                    className="w-full h-40 rounded-3xl border-2 border-slate-50 bg-slate-50 px-6 py-5 text-sm focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-800 resize-none placeholder:font-medium"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Column: Invitees */}
              <div className="lg:col-span-5 flex flex-col bg-slate-50 rounded-[32px] border border-slate-100 p-8 space-y-6">
                <div className="flex items-center justify-between px-1">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Invite Participants</label>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight">{form.invitees.length} users selected</p>
                   </div>
                   <div className="flex -space-x-2">
                      {form.invitees.slice(0, 3).map((i, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-400">
                           {i.name?.charAt(0)}
                        </div>
                      ))}
                   </div>
                </div>

                {/* Selected Area */}
                <div className="flex flex-wrap gap-2 py-4 border-b border-slate-200 min-h-[60px]">
                  {form.invitees.map((i) => (
                    <span key={i.id} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm animate-in zoom-in-95 group">
                      {i.name}
                      <button onClick={() => removeInvitee(i.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {form.invitees.length === 0 && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic py-2">No participants added yet</p>}
                </div>

                {/* Search & Filter */}
                <div className="space-y-4">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                      placeholder="Find people by name..."
                      className="w-full rounded-[20px] border border-slate-200 px-12 py-3.5 text-xs outline-none focus:ring-4 ring-indigo-500/5 focus:border-indigo-500 font-bold bg-white transition-all shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 relative">
                    <div className="relative group">
                      <select 
                        className="w-full rounded-xl border border-slate-200 pl-4 pr-8 py-3 text-[10px] font-extrabold text-slate-600 outline-none appearance-none bg-white shadow-sm focus:border-indigo-500"
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        disabled={isRestrictedRole}
                      >
                        {!isRestrictedRole && <option value="">All Departments</option>}
                        {depts.map(d => (
                          <option key={d.id || d._id} value={d.id || d._id} disabled={isRestrictedRole && d.id !== auth?.departmentId && d._id !== auth?.departmentId}>
                            {d.name.toUpperCase()} {isRestrictedRole && (d.id === auth?.departmentId || d._id === auth?.departmentId) ? "(YOURS)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                    </div>
                    
                    <div className="relative group">
                      <select 
                        className="w-full rounded-xl border border-slate-200 pl-4 pr-8 py-3 text-[10px] font-extrabold text-slate-600 outline-none appearance-none bg-white shadow-sm focus:border-indigo-500"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option value="">All Roles</option>
                        <option value="manager">MANAGERS</option>
                        <option value="team_lead">TEAM LEADS</option>
                        <option value="intern">EMPLOYEES</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                    </div>
                  </div>

                  {(selectedDept || selectedRole || searchQuery) && (
                    <button 
                      onClick={() => {
                        setSelectedDept("");
                        setSelectedRole("");
                        setSearchQuery("");
                      }}
                      className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                      <X size={10} /> Clear all filters
                    </button>
                  )}
                </div>

                {/* Results List */}
                <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                   <div className="p-4 border-b border-slate-50 flex items-center justify-between text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      <span>Search Results</span>
                      {searchResults.length > 0 && (
                        <button 
                          onClick={addAllFromSearch}
                          className="text-indigo-600 hover:text-indigo-700 font-black cursor-pointer bg-indigo-50 px-3 py-1.5 rounded-lg transition-all active:scale-95"
                        >
                          Select All ({searchResults.length})
                        </button>
                      )}
                   </div>
                   <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                      {searching ? (
                        <div className="p-8 text-center"><Loader2 size={24} className="animate-spin mx-auto text-indigo-200" /></div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="mx-auto text-slate-100 mb-2" size={40} />
                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No users found</p>
                        </div>
                      ) : (
                        searchResults.map(user => (
                          <div key={user.id || user._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    {user.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-xs font-black text-slate-800 leading-none">{user.name}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{user.role?.replace(/_/g, " ")} • {user.departmentName}</p>
                                </div>
                            </div>
                            <button 
                              onClick={() => addInvitee(user)}
                              className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-10 py-8 flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-2xl border-2 border-slate-200 bg-white px-8 py-3 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all font-sans"
              >
                DISCARD
              </button>
              <button
                disabled={submitting}
                onClick={handleCreate}
                className="flex items-center gap-3 rounded-2xl bg-indigo-600 px-12 py-3 text-sm font-black text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                SCHEDULE MEETING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingManagement;
