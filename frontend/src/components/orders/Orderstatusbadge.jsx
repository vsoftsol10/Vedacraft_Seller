const STATUS_CLASS = {
  Processing: "status-badge--processing",
  Shipped: "status-badge--shipped",
  Delivered: "status-badge--delivered",
  Returned: "status-badge--returned",
};

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`status-badge ${STATUS_CLASS[status] ?? ""}`}>
      {status}
    </span>
  );
}