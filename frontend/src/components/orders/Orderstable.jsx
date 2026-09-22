import { MoreVertical } from "lucide-react";
import OrderStatusBadge from "./Orderstatusbadge";

export default function OrdersTable({ orders, query, onViewOrder }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e5e7eb] bg-surface">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#e5e7eb] text-[#6b7280]">
            {['Order ID','Customer','Product Name','Items','Amount','Status','Payment','Date','Action'].map((heading) => <th className="px-6 py-4 font-semibold" key={heading}>{heading}</th>)}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr className="last:[&>td]:border-0" key={order.id}>
              <td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">{order.id}</td><td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">{order.customer}</td><td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">{order.product}</td><td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">{order.items}</td><td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">{order.amount}</td>
              <td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">
                <OrderStatusBadge status={order.status} />
              </td>
<<<<<<< HEAD
              <td>{order.payment}</td>
              <td>{order.date}</td>
              <td>
                <button className="orders-table__action" type="button" aria-label={`View order ${order.id}`} onClick={() => onViewOrder(order)}>
                  <MoreVertical size={16} />
                </button>
              </td>
=======
              <td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">{order.payment}</td><td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">{order.date}</td>
           <td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">
  <button
    className="cursor-pointer rounded-md border-0 bg-[#d9f2df] px-3 py-1.5 text-sm font-medium text-[#1a7f37] hover:bg-[#c3ecd0]"
    type="button"
    aria-label={`View order ${order.id}`}
    onClick={() => onViewOrder(order)}
  >
    View
  </button>
</td>
>>>>>>> 78e1cc33d0dad5fb46c601957e814d18b2277c7a
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={9} className="p-8 text-center text-neutral">
                No orders match "{query}"
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
