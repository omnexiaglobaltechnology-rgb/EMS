import StatusPill from "./StatusPill";

import { Calendar, Clock, CheckSquare, Play, Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * Visual card representing a task assigned to an intern.
 * Displays title, priority, due date, timeframe, tags, progress status, and assignee.
 *
 * @param {object} task - Task details including priority, due date, time, status, and assignee
 */
const TaskCard = ({ task, onStatusUpdate }) => {
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (!onStatusUpdate) return;
    setStarting(true);
    try {
      await onStatusUpdate(task.id, 'in_progress');
    } finally {
      setStarting(false);
    }
  };
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-7 flex flex-col md:flex-row justify-between gap-6 transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] group relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/10" />
      
      <div className="flex items-start gap-6 flex-1">
        {/* Left Side Icon */}
        <div className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:rotate-12
          ${task.overdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
          <CheckSquare size={28} strokeWidth={2.5} />
        </div>

        <div className="space-y-4 flex-1">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors leading-tight">{task.title}</h3>
            <p className="text-slate-500 text-xs font-bold line-clamp-1 opacity-70 group-hover:opacity-100">{task.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* Priority */}
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Priority:</span>
               <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg border
                 ${task.priority === "high" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                    task.priority === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                    "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                 {task.priority}
               </span>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deadline:</span>
               <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest
                 ${task.overdue ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                 <Calendar size={14} strokeWidth={3} />
                 {task.due}
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-6 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8 min-w-[160px]">
        <div className="flex flex-col items-center md:items-end gap-3">
          <StatusPill status={task.status} />
          {(task.status === 'assigned' || task.status === 'rejected') && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {starting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Play size={10} fill="currentColor" />
              )}
              {starting ? 'Starting...' : 'Start Task'}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned To</p>
            <p className="text-xs font-black text-white">{task.assignee || 'You'}</p>
          </div>
          <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/30 text-indigo-400 text-sm font-black shadow-lg ring-4 ring-indigo-500/5 group-hover:ring-indigo-500/10 transition-all">
            {(task.assignee || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
