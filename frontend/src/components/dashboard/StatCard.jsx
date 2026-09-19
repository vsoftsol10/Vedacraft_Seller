export default function StatCard({ icon: Icon, label, value, change, iconBg, iconColor }) {
  return (
    <section className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <span className="text-sm text-gray-900">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-700 mt-1">+{change} vs last month</div>
    </section>
  );
}
