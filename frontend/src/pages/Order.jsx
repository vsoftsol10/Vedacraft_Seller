import { useState } from "react";
import OrderStatCard from "../components/orders/Orderstatcard";
import OrdersToolbar from "../components/orders/Orderstoolbar";
import OrdersTable from "../components/orders/Orderstable";
import { ORDER_STAT_CARDS, MOCK_ORDERS } from "../components/orders/Ordersconstants";
import "../styles/orders.css";

export default function Order() {
  const [query, setQuery] = useState("");

  const filteredOrders = MOCK_ORDERS.filter((order) =>
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

      <OrdersTable orders={filteredOrders} query={query} />
    </div>
  );
}
