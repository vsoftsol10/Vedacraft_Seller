// import { useEffect, useState } from "react";
// import { IndianRupee, Package, ShoppingBag, Star } from "lucide-react";
// import OrderStatCard from "../components/orders/Orderstatcard";
// import OrdersToolbar from "../components/orders/Orderstoolbar";
// import OrdersTable from "../components/orders/Orderstable";
// import OrderDetails from "../components/orders/Orderdetails";
// import { getOrders, updateOrderStatus } from "../api/orderapi";

// export default function Order() {
//   const [query, setQuery] = useState("");
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState("");


//   useEffect(() => {
//     let active = true;
//     const parseJson = (value, fallback) => {
//       if (!value) return fallback;
//       if (typeof value === "object") return value;
//       try { return JSON.parse(value); } catch { return fallback; }
//     };
//     const formatMoney = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
//     const formatDate = (value) => value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(value)) : "—";
//     const imageUrl = (value) => {
//       const markdownUrl = String(value || "").match(/\]\((https?:\/\/[^)]+)\)/);
//       return markdownUrl?.[1] || value || null;
//     };

//     const loadOrders = async () => {
//       try {
//         const response = await getOrders();
//         const records = Array.isArray(response) ? response : response.data ?? [];
//         if (!active) return;
//         setOrders(records.map((record) => {
//           const items = parseJson(record.items, []);
//           const item = Array.isArray(items) ? items[0] ?? {} : {};
//           const address = parseJson(record.address, {});
//           return {
//             rawId: record.id ?? record.idx,
//             // The order number identifies the purchase; a product slug identifies only its item.
//             id: record.order_number || item.slug || `#${String(record.id ?? record.idx ?? "").slice(0, 8).toUpperCase()}`,
//             customer: address.fullName || "Customer",
//             phone: address.phoneNumber,
//             address: [address.address, address.landmark, address.city, address.state, address.pincode].filter(Boolean).join(", "),
//             product: record.product || item.name || "Product",
//             items: record.item_count ?? item.quantity ?? 0,
//             amount: formatMoney(record.total),
//             status: record.status || "Placed",
//             payment: String(record.payment_method || "—").toUpperCase() === "COD" ? "Cash On Delivery" : record.payment_method || "—",
//             date: formatDate(record.created_at),
//             image: imageUrl(item.image),
//           };
//         }));
//       } catch (requestError) {
//         if (active) setError(requestError.response?.data?.message || "Unable to load orders.");
//       } finally {
//         if (active) setIsLoading(false);
//       }
//     };
//     loadOrders();
//     return () => { active = false; };
//   }, []);

//   const filteredOrders = orders.filter((order) =>
//     [order.id, order.customer, order.product]
//       .join(" ")
//       .toLowerCase()
//       .includes(query.toLowerCase())
//   );
//   const countByStatus = (statuses) => orders.filter((order) => statuses.includes(String(order.status).toLowerCase())).length;
//   const handleUpdateStatus = async (orderId, status) => {
//     setError("");
//     const response = await updateOrderStatus(orderId, status);
//     const updatedStatus = response.data?.status || status;
//     setOrders((currentOrders) => currentOrders.map((order) =>
//       order.rawId === orderId ? { ...order, status: updatedStatus } : order
//     ));
//     setSelectedOrder((currentOrder) => currentOrder && currentOrder.rawId === orderId
//       ? { ...currentOrder, status: updatedStatus }
//       : currentOrder);
//   };
//   const statCards = [
//     { key: "new", label: "New Order", value: countByStatus(["placed", "processing", "packed"]), icon: ShoppingBag, iconClass: "bg-[#fef3c7] text-[#d97706]" },
//     { key: "shipped", label: "Shipped", value: countByStatus(["shipped"]), icon: IndianRupee, iconClass: "bg-[#d1fae5] text-[#059669]" },
//     { key: "delivered", label: "Delivered", value: countByStatus(["delivered"]), icon: Package, iconClass: "bg-[#d1fae5] text-[#059669]" },
//     { key: "returned", label: "Returned", value: countByStatus(["returned"]), icon: Star, iconClass: "bg-[#fef3c7] text-[#d97706]" },
//   ];

//   return (
//     <div className="flex flex-col gap-6">
//       <div>
//         <h1 className="m-0 text-[30px] font-bold text-[#111827]">Orders</h1>
//         <p className="mb-0 mt-1 text-[#6b7280]">Manage customer orders and track deliveries</p>
//       </div>

//       <div className="flex flex-wrap gap-4">
//         {statCards.map(({ key, ...card }) => (
//           <OrderStatCard key={key} {...card} />
//         ))}
//       </div>

//       <OrdersToolbar query={query} onQueryChange={setQuery} />

//       {error && <p className="m-0 rounded-lg bg-[#fef3f2] p-4 text-danger">{error}</p>}
//       {isLoading ? <p className="m-0 rounded-lg bg-surface p-4 text-[#4b5563]">Loading orders…</p> : <OrdersTable orders={filteredOrders} query={query} onViewOrder={setSelectedOrder} />}
//       {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={handleUpdateStatus} />}
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { IndianRupee, Package, ShoppingBag, Star } from "lucide-react";
import OrderStatCard from "../components/orders/Orderstatcard";
import OrdersToolbar from "../components/orders/Orderstoolbar";
import OrdersTable from "../components/orders/Orderstable";
import OrderDetails from "../components/orders/Orderdetails";
import { getOrders, updateOrderStatus } from "../api/orderapi";

export default function Order() {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none");
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
        const mappedOrders = records.map((record) => {
          const items = parseJson(record.items, []);
          const item = Array.isArray(items) ? items[0] ?? {} : {};
          const address = parseJson(record.address, {});
          return {
            rawId: record.id ?? record.idx,
            // The order number identifies the purchase; a product slug identifies only its item.
            id: record.order_number || item.slug || `#${String(record.id ?? record.idx ?? "").slice(0, 8).toUpperCase()}`,
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
        });
        setOrders(mappedOrders);
        const selectedOrderId = location.state?.selectedOrderId;
        if (selectedOrderId) setSelectedOrder(mappedOrders.find((order) => order.rawId === selectedOrderId) ?? null);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Unable to load orders.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadOrders();
    return () => { active = false; };
  }, [location.state]);

  const paymentTypeOptions = [
    { value: "none", label: "Default" },
    ...Array.from(new Set(orders.map((order) => order.payment).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((payment) => ({ value: payment, label: payment })),
  ];

  const filteredOrders = orders
    .filter((order) =>
      [order.id, order.customer, order.product]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    .filter((order) => statusFilter === "all" || String(order.status).toLowerCase() === statusFilter)
    .sort((a, b) => {
      if (sortBy === "none") return 0;
      // Groups the chosen payment type (Cash On Delivery, GPay, UPI, ...) to the top,
      // keeping everything else in its existing order.
      if (a.payment === sortBy && b.payment !== sortBy) return -1;
      if (a.payment !== sortBy && b.payment === sortBy) return 1;
      return 0;
    });

  const countByStatus = (statuses) => orders.filter((order) => statuses.includes(String(order.status).toLowerCase())).length;
  const handleUpdateStatus = async (orderId, status) => {
    setError("");
    const response = await updateOrderStatus(orderId, status);
    const updatedStatus = response.data?.status || status;
    setOrders((currentOrders) => currentOrders.map((order) =>
      order.rawId === orderId ? { ...order, status: updatedStatus } : order
    ));
    setSelectedOrder((currentOrder) => currentOrder && currentOrder.rawId === orderId
      ? { ...currentOrder, status: updatedStatus }
      : currentOrder);
  };
  const statCards = [
    { key: "new", label: "New Order", value: countByStatus(["placed", "processing", "packed"]), icon: ShoppingBag, iconClass: "bg-[#fef3c7] text-[#d97706]" },
    { key: "shipped", label: "Shipped", value: countByStatus(["shipped"]), icon: IndianRupee, iconClass: "bg-[#d1fae5] text-[#059669]" },
    { key: "delivered", label: "Delivered", value: countByStatus(["delivered"]), icon: Package, iconClass: "bg-[#d1fae5] text-[#059669]" },
    { key: "returned", label: "Returned", value: countByStatus(["returned"]), icon: Star, iconClass: "bg-[#fef3c7] text-[#d97706]" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0 text-[30px] font-bold text-[#111827]">Orders</h1>
        <p className="mb-0 mt-1 text-[#6b7280]">Manage customer orders and track deliveries</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {statCards.map(({ key, ...card }) => (
          <OrderStatCard key={key} {...card} />
        ))}
      </div>

      <OrdersToolbar
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOptions={paymentTypeOptions}
      />

      {error && <p className="m-0 rounded-lg bg-[#fef3f2] p-4 text-danger">{error}</p>}
      {isLoading ? <p className="m-0 rounded-lg bg-surface p-4 text-[#4b5563]">Loading orders…</p> : <OrdersTable orders={filteredOrders} query={query} onViewOrder={setSelectedOrder} />}
      {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={handleUpdateStatus} />}
    </div>
  );
}