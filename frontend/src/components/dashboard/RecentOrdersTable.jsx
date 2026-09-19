const orders = [
  { id: "#VC10254", customer: "Priya Sharma", amount: "₹2,598", status: "Pending", date: "03/11/26" },
  { id: "#VC10354", customer: "Meera Iyer", amount: "₹4,598", status: "Shipped", date: "04/11/26" },
  { id: "#VC10554", customer: "Anu Mehta", amount: "₹1,667", status: "Delivered", date: "08/11/26" },
];

const statusStyles = {
  Pending: "bg-amber-50 text-amber-600",
  Shipped: "bg-violet-50 text-violet-600",
  Delivered: "bg-emerald-50 text-emerald-600",
};

export default function RecentOrdersTable() {
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Recent Orders</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-900 border-b border-gray-200">
            <th className="pb-2 font-medium">Order ID</th>
            <th className="pb-2 font-medium">Customer</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-gray-50 last:border-0">
              <td className="py-3 text-gray-700">{o.id}</td>
              <td className="py-3 text-gray-700">{o.customer}</td>
              <td className="py-3 text-gray-700">{o.amount}</td>
              <td className="py-3">
                <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[o.status]}`}>
                  {o.status}
                </span>
              </td>
              <td className="py-3 text-gray-500">{o.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
