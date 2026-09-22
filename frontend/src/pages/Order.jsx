import { useEffect, useState } from "react";
import OrderStatCard from "../components/orders/Orderstatcard";
import OrdersToolbar from "../components/orders/Orderstoolbar";
import OrdersTable from "../components/orders/Orderstable";
import OrderDetails from "../components/orders/Orderdetails";
import { ORDER_STAT_CARDS } from "../components/orders/Ordersconstants";
import { getOrders } from "../api/orderapi";
import "../styles/orders.css";

export default function Order() {
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const parseJson = (value, fallback) => {
      if (!value) return fallback;
      if (typeof value === "object") return value;
      try { return JSON.parse(value); } catch { return fallback; }
    };
    const formatMoney = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
    const formatDate = (value) => value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(value)) : "—";
    const imageUrl = (value) => {
      const markdownUrl = String(value || "").match(/\]\((https?:\/\/[^)]+)\)/);
      return markdownUrl?.[1] || value || null;
    };

    const loadOrders = async () => {
      try {
        const response = await getOrders();
        const records = Array.isArray(response) ? response : response.data ?? [];
        if (!active) return;
        setOrders(records.map((record) => {
          const items = parseJson(record.items, []);
          const item = Array.isArray(items) ? items[0] ?? {} : {};
          const address = parseJson(record.address, {});
          return {
            rawId: record.id ?? record.idx,
            id: item.slug || `#${String(record.id ?? record.idx ?? "").slice(0, 8).toUpperCase()}`,
            customer: address.fullName || "Customer",
            phone: address.phoneNumber,
            address: [address.address, address.landmark, address.city, address.state, address.pincode].filter(Boolean).join(", "),
            product: record.product || item.name || "Product",
            items: record.item_count ?? item.quantity ?? 0,
            amount: formatMoney(record.total),
            status: record.status || "Placed",
            payment: String(record.payment_method || "—").toUpperCase() === "COD" ? "Cash On Delivery" : record.payment_method || "—",
            date: formatDate(record.created_at),
            image: imageUrl(item.image),
          };
        }));
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Unable to load orders.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadOrders();
    return () => { active = false; };
  }, []);

  const filteredOrders = orders.filter((order) =>
    [order.id, order.customer, order.product]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="orders-page">
      <div className="orders-page__header">
        <h1>Orders</h1>
        <p>Manage customer orders and track deliveries</p>
      </div>

      <div className="orders-page__stats">
        {ORDER_STAT_CARDS.map((card) => (
          <OrderStatCard key={card.key} {...card} />
        ))}
      </div>

      <OrdersToolbar query={query} onQueryChange={setQuery} />

      {error && <p className="orders-page__error">{error}</p>}
      {isLoading ? <p className="orders-page__loading">Loading orders…</p> : <OrdersTable orders={filteredOrders} query={query} onViewOrder={setSelectedOrder} />}
      {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
