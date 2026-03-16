import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { usersApi } from "../../utils/api";
import UserModal from "../../components/manager/UserModal";
import { Plus, User, Edit, Trash2, Mail, ExternalLink, Activity, History, Loader } from "lucide-react";

/**
 * Specialized Employee Management interface for Managers and Senior Staff.
 */
const EmployeeManagement = () => {
    const { id: currentUserId, role: currentUserRole } = useSelector(state => state.auth);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            setLoading(true);
            // In a real scenario, this would filter by subordinates. 
            // For now, let's fetch all relevant user types.
            const data = await usersApi.getAll();
            // Simple filter for subordinates (dummy logic or based on reportsTo)
            setMembers(data);
        } catch (err) {
            console.error("Failed to fetch team", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUser = async (formData) => {
        try {
            if (selectedUser) {
                await usersApi.update(selectedUser._id, formData);
            } else {
                await usersApi.create({ ...formData, reportsTo: currentUserId });
            }
            fetchTeam();
            setShowModal(false);
            setSelectedUser(null);
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Remove this member from the organization?")) return;
        try {
            await usersApi.delete(id);
            fetchTeam();
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader className="animate-spin text-indigo-600" size={32} /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center glass-dark p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d4ff]/5 blur-[100px] rounded-full group-hover:bg-[#00d4ff]/10 transition-colors"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight">
                        Team <span className="text-[#00d4ff] blue-glow">Management</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="h-1 w-12 bg-[#00d4ff] rounded-full blue-glow"></div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                            Subordinate Directory Alpha
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => { setSelectedUser(null); setShowModal(true); }}
                    className="blue-button rounded-2xl px-6 py-4 flex items-center gap-3 active:scale-95 z-10"
                >
                    <Plus size={18} />
                    <span className="text-xs uppercase tracking-widest">Add Member</span>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {members.map(member => (
                    <div key={member._id} className="card-glass group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-[#00d4ff] group-hover:border-[#00d4ff]/30 transition-all duration-500">
                                    <User size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase">{member.name}</h3>
                                    <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                        <Mail size={14} className="text-[#00d4ff]" />
                                        {member.email}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setSelectedUser(member); setShowModal(true); }}
                                    className="p-3 text-white/20 hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 rounded-xl transition-all border border-transparent hover:border-[#00d4ff]/20"
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(member._id)}
                                    className="p-3 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Status Vector</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#00d4ff] blue-glow" />
                                    <span className="text-xs font-black text-[#00d4ff] uppercase tracking-wider">{member.role}</span>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Neural Rating</div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-[#00d4ff]" />
                                    <span className="text-xs font-black text-white uppercase tracking-wider">8.4 / 10</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                            <button className="flex items-center gap-2 text-[10px] font-black text-[#00d4ff] uppercase tracking-[0.2em] hover:gap-3 transition-all blue-glow">
                                <History size={14} />
                                Task History
                            </button>
                            <button className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-all">
                                View Profile
                                <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <UserModal 
                    title={selectedUser ? "Edit Member" : "New Team Member"}
                    user={selectedUser}
                    onClose={() => setShowModal(false)}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
};

export default EmployeeManagement;
