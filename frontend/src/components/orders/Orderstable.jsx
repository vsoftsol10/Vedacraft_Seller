import OrderStatusBadge from "./Orderstatusbadge";

export default function OrdersTable({ orders, query, onViewOrder }) {
  return (
    <div className="vc-table-wrapper">
      <table className="vc-table min-w-[900px] text-left lg:min-w-[auto]">
        <thead>
          <tr>
            {['Order ID','Customer','Product Name','Amount','Status','Payment','Action'].map((heading) => <th key={heading}>{heading}</th>)}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr className="last:[&>td]:border-0" key={order.id}>
              <td>{order.id}</td><td>{order.customer}</td><td>{order.product}</td>
              {/* <td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">{order.items}</td> */}
              <td>{order.amount}</td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
              <td>{order.payment}</td>
              {/* <td className="border-b border-[#f3f4f6] px-6 py-4 text-[#374151]">{order.date}</td> */}
           <td>
  <button
    className="vc-table-action cursor-pointer rounded-md border-0 bg-[#d9f2df] text-[#1a7f37] hover:bg-[#c3ecd0]"
    type="button"
    aria-label={`View order ${order.id}`}
    onClick={() => onViewOrder(order)}
  >
    View
  </button>
</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={9} className="vc-table-empty text-neutral">
                No orders match "{query}"
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
