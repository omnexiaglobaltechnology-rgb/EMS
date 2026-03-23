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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm shadow-slate-100/50">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your direct reports and department members</p>
                </div>
                <button 
                    onClick={() => { setSelectedUser(null); setShowModal(true); }}
                    className="bg-indigo-600 text-white rounded-2xl px-6 py-3 flex items-center gap-2 font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                    <Plus size={18} />
                    Add Member
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {members.map(member => (
                    <div key={member._id} className="bg-white rounded-[32px] border border-slate-100 p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-300">
                                    <User size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Mail size={14} />
                                        {member.email}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setSelectedUser(member); setShowModal(true); }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(member._id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-sm font-bold text-slate-700 capitalize">{member.role}</span>
                                </div>
                            </div>
                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Performance</div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-indigo-500" />
                                    <span className="text-sm font-bold text-slate-700">8.4 / 10</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:gap-3 transition-all">
                                <History size={14} />
                                Task History
                            </button>
                            <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all">
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
