/**
 * Full-screen error state for users attempting to access routes
 * outside their assigned permission scope.
 */
const Unauthorized = () => {
  return (
    <div className="h-[80vh] flex items-center justify-center p-6">
      <div className="card-glass max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-red-500/30 border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <span className="text-4xl">🔐</span>
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            Protocol <span className="text-red-500">Denied</span>
          </h1>
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em] mt-2">
            Unauthorized Access Attempt
          </p>
        </div>
        <p className="text-sm text-white/60 leading-relaxed bg-white/30 p-4 rounded-2xl border border-white/30">
          Your credentials do not encompass the authorization level required for this sector. 
          Please contact the system administrator.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="w-full rounded-2xl bg-white/30 border border-white/30 py-4 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-emerald-500/30 hover:text-[#00ff9f] transition-all active:scale-95 emerald-glow"
        >
          Return to Previous Sector
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
