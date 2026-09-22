const STATUS_CLASS = {
  Placed: "bg-[#dbeafe] text-[#1d4ed8]",
  Processing: "bg-[#ffedd5] text-[#ea580c]",
  Shipped: "bg-[#fef3c7] text-[#d97706]",
  Delivered: "bg-[#d1fae5] text-[#047857]",
  Returned: "bg-[#ffe4e6] text-[#e11d48]",
};

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-[6px] px-3 py-1 text-sm font-medium ${STATUS_CLASS[status] ?? ""}`}>
      {status}
    </span>
  );
}
