import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { tasksApi } from "../../utils/api";
import { Loader, CheckCircle2, Clock, AlertTriangle, Send, User } from "lucide-react";

const EmployeeMyTasks = () => {
    const { id: userId } = useSelector(state => state.auth);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await tasksApi.getAll();
                const myTasks = data.filter(t => t.assignedToId === userId || t.currentResponsibleId === userId);
                setTasks(myTasks);
            } catch (err) {
                console.error("Failed to fetch tasks", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [userId]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="text-emerald-500" />;
            case 'rejected': return <AlertTriangle className="text-red-500" />;
            case 'submitted': return <Clock className="text-amber-500" />;
            default: return <Clock className="text-slate-400" />;
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map(task => (
                    <div key={task._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-slate-900 line-clamp-1">{task.title}</h3>
                            {getStatusIcon(task.status)}
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{task.description}</p>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            <div className={`px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                                task.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                            }`}>
                                {task.priority}
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                             <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                                View Details
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmployeeMyTasks;
