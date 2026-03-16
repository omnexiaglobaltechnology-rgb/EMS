/**
 * A layout wrapper providing a standardized title and spacing for dashboard sections.
 *
 * @param {string} title - The section heading
 * @param {React.ReactNode} children - The contents rendered within the section
 */
const Section = ({ title, children }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-4 w-1 bg-[#00d4ff] rounded-full blue-glow"></div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default Section;
