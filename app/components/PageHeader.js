export default function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  children,
  className = "",
}) {
  return (
    <div
      className={`bg-[#0F172A] text-white p-5 md:p-6 rounded-2xl shadow-xl border-2 border-amber-400/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${className}`}
    >
      <div className="flex items-start gap-4 min-w-0">
        {icon ? (
          <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-amber-500/20 to-sky-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black tracking-wide text-white uppercase">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs md:text-sm font-semibold text-slate-300 mt-1">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {(badge || children) && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {badge ? (
            <div className="bg-amber-400/10 border border-amber-400/40 text-amber-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
              {badge}
            </div>
          ) : null}
          {children}
        </div>
      )}
    </div>
  );
}
