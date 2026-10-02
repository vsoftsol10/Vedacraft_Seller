export default function OrderStatCard({ label, value, delta, icon: Icon, iconClass }) {
  return (
    <div className="min-w-0 flex-1 rounded-xl border border-[#e5e7eb] bg-surface p-3 sm:p-5 lg:min-w-[220px]">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className={`flex size-10 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon size={18} />
        </span>
        <span className="min-w-0 text-sm text-slate lg:min-w-[auto]">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold text-[#111827]">{value}</div>
      {delta && <div className="mt-1 text-xs text-neutral">
        <span className="font-semibold text-slate">{delta}</span> vs last month
      </div>}
    </div>
  );
}
