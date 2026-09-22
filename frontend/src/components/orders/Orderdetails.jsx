import { Check, Circle, CreditCard, Phone, X } from "lucide-react";
import OrderStatusBadge from "./Orderstatusbadge";

const TIMELINE = ["Order Received", "Processing", "Packed", "Shipped", "Delivered"];
const STATUS_INDEX = { Placed: 0, Processing: 1, Shipped: 3, Delivered: 4, Returned: 0 };

export default function OrderDetails({ order, onClose }) {
  const currentStep = STATUS_INDEX[order.status] ?? 0;
  const phone = order.phone ?? "Not available";
  const address = order.address ?? "Not available";

  return <div className="order-drawer-backdrop" onMouseDown={onClose}>
    <aside className="order-drawer" aria-label={`Order details for ${order.id}`} onMouseDown={(event) => event.stopPropagation()}>
      <header className="order-drawer__header">
        <div><h2>Order {order.id}</h2><p>Placed on {order.date}</p></div>
        <button type="button" className="order-drawer__close" onClick={onClose} aria-label="Close order details"><X size={30} /></button>
      </header>

      <section className="order-drawer__section"><h3>Customer Details</h3><div className="customer-details__body"><span className="customer-avatar">{order.customer.charAt(0)}</span><div><strong>{order.customer}</strong><span><Phone size={13} /> {phone}</span></div></div></section>
      <section className="order-drawer__section"><h3>Delivery Address</h3><p className="order-drawer__muted">{address}</p></section>
      <section className="order-drawer__section item-details"><h3>Items Details</h3><div className="item-details__row">{order.image ? <img className="item-details__image" src={order.image} alt="" /> : <div className="item-details__image">📦</div>}<div><strong>{order.product}</strong><span>{order.amount}</span></div><b>{order.items}</b></div><div className="item-details__total"><strong>Total Amount</strong><strong>{order.amount}</strong></div></section>
      <section className="order-drawer__section"><h3>Payment Information</h3><p className="payment-info"><CreditCard size={24} /> {order.payment === "GPay" ? "Google Pay" : order.payment}</p></section>
      <section className="order-drawer__section order-timeline"><div className="order-timeline__heading"><h3>Order Timeline</h3><OrderStatusBadge status={order.status} /></div><ol>{TIMELINE.map((step, index) => <li className={index <= currentStep ? "complete" : ""} key={step}>{index < currentStep ? <Check size={13} /> : <Circle size={13} />}<span>{step}</span></li>)}</ol></section>
      <footer className="order-drawer__footer"><button type="button" className="order-drawer__cancel" onClick={onClose}>Cancel</button><button type="button" className="order-drawer__save" onClick={onClose}>Save</button></footer>
    </aside>
  </div>;
}
