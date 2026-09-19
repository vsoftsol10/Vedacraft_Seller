export default function OrderStatCard({ label, value, delta, icon: Icon, iconClass }) {
  return (
    <div className="order-stat-card">
      <div className="order-stat-card__top">
        <span className={`order-stat-card__icon ${iconClass}`}>
          <Icon size={18} />
        </span>
        <span className="order-stat-card__label">{label}</span>
      </div>
      <div className="order-stat-card__value">{value}</div>
      <div className="order-stat-card__delta">
        <span className="order-stat-card__delta-value">{delta}</span> vs last month
      </div>
    </div>
  );
}