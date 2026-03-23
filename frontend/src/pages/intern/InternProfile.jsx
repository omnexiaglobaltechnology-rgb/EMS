import { Mail, Calendar, MapPin, Award, User, Briefcase, Shield, Search } from "lucide-react";
import { useSelector } from "react-redux";

/**
 * Personal profile view for interns.
 * Redesigned with premium dark glassmorphism and optimized font sizes.
 */
const InternProfile = () => {
  // Get user info from Redux auth
  const auth = useSelector((state) => state.auth || {});

  const profile = {
    name: auth.name || "Prachi",
    role: auth.role ? auth.role.replace(/_/g, " ") : "Frontend Intern",
    email: auth.email || "prachi@omnexiatechnology.in",
    department: auth.departmentName || "Engineering",
    joiningDate: "Jan 15, 2026",
    mentor: "John Williams",
    skills: ["React", "Tailwind CSS", "JavaScript", "UI Design", "Node.js", "Express"],
  };

  // Generate initials 
  const initials = (profile.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 min-h-screen bg-[#0f172a] text-white p-2">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
             <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-inner">
               <User size={16} />
             </div>
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Personnel Portal</span>
           </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Member Profile
          </h1>
          <p className="text-slate-400 mt-1.5 text-[13px] font-bold flex items-center gap-2 opacity-80">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            View and manage your personal professional identity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Card: Identity Card */}
        <div className="lg:col-span-1">
          <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group transition-all duration-500 hover:bg-white/10">
            {/* Avatar Section */}
            <div className="relative mb-6">
              <div className="h-32 w-32 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-2xl transition-transform duration-700">
                <div className="h-full w-full rounded-[30px] bg-[#0f172a] flex items-center justify-center text-4xl font-black text-white group-hover:scale-95 transition-transform duration-700">
                  {initials}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 h-9 w-9 rounded-xl bg-emerald-500 border-4 border-[#0f172a] flex items-center justify-center text-white shadow-lg">
                <Shield size={16} strokeWidth={3} />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white tracking-tight uppercase group-hover:text-indigo-400 transition-colors">
                {profile.name}
              </h2>
              <div className="inline-flex px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest shadow-inner">
                {profile.role || "Frontend Intern"}
              </div>
            </div>

            <div className="w-full mt-8 space-y-3 pt-8 border-t border-white/5">
              <div className="flex items-center gap-3 text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all group/item">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Mail size={16} />
                </div>
                <div className="text-left overflow-hidden">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Company Email</p>
                   <p className="text-[11px] font-black text-white truncate">{profile.email}</p>
                </div>
              </div>

               <div className="flex items-center gap-3 text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all group/item">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Briefcase size={16} />
                </div>
                <div className="text-left">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Department</p>
                   <p className="text-[11px] font-black text-white">{profile.department}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Details & Skills */}
        <div className="lg:col-span-2 space-y-8">
          {/* Information Grid Container */}
          <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-3xl overflow-hidden shadow-2xl">
             {/* Section 1: Professional Background */}
             <div className="p-8 border-b border-white/5">
                <div className="flex items-center gap-3 mb-6">
                   <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Search size={18} />
                   </div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Internship Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <InfoBox label="Designation" value={profile.role} icon={Briefcase} />
                   <InfoBox label="Joining Date" value={profile.joiningDate} icon={Calendar} />
                   <InfoBox label="Mentor" value={profile.mentor} icon={User} />
                   <InfoBox label="Work Location" value="Remote / Office" icon={MapPin} />
                </div>
             </div>

             {/* Section 2: Technical Arsenal (Skills) */}
             <div className="p-8 bg-white/5">
                <div className="flex items-center gap-3 mb-6">
                   <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-indigo-500/20">
                      <Award size={18} />
                   </div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Technical Arsenal</h3>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  {profile.skills.map((skill, index) => (
                    <div
                      key={skill}
                      className="px-4 py-2 rounded-xl bg-[#0f172a] border border-white/10 text-slate-300 font-bold text-xs shadow-xl hover:bg-white/5 hover:border-indigo-500/50 hover:text-white transition-all transform hover:-translate-y-1 animate-in zoom-in-50 duration-500 delay-[index*50ms]"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components for clean layout
const InfoBox = ({ label, value, icon: Icon }) => (
  <div className="group relative">
     <div className="flex items-start gap-3 p-4 rounded-2xl border border-white/5 bg-white/5 group-hover:bg-white/10 transition-all duration-500">
        <div className="mt-1 text-slate-600 group-hover:text-indigo-400 transition-colors">
           <Icon size={16} />
        </div>
        <div>
           <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">{label}</p>
           <p className="text-[13px] font-black text-white leading-tight">{value}</p>
        </div>
     </div>
  </div>
);

export default InternProfile;
