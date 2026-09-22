import { MoreVertical } from "lucide-react";
import OrderStatusBadge from "./Orderstatusbadge";

export default function OrdersTable({ orders, query, onViewOrder }) {
  return (
    <div className="orders-table-wrap">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Product Name</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.product}</td>
              <td>{order.items}</td>
              <td>{order.amount}</td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
              <td>{order.payment}</td>
              <td>{order.date}</td>
              <td>
                <button className="orders-table__action" type="button" aria-label={`View order ${order.id}`} onClick={() => onViewOrder(order)}>
                  <MoreVertical size={16} />
                </button>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={9} className="orders-table__empty">
                No orders match "{query}"
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
