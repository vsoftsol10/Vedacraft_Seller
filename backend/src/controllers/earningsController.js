import { getSellerOrders, matchedSellerItems } from "../services/sellerOrders.js";

const itemValue = (item) => (Number(item?.sellingPrice ?? item?.price) || 0) * (Number(item?.quantity) || 0);

const monthStart = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const normalizeStatus = (status) => String(status || "").trim().toLowerCase();
const isCancelled = (status) => ["cancelled", "canceled"].includes(normalizeStatus(status));
const isReturned = (status) => normalizeStatus(status) === "returned";
const isExcluded = (status) => isCancelled(status) || isReturned(status);

const orderSellerValue = (order, productIds) =>
  matchedSellerItems(order, productIds).reduce((sum, item) => sum + itemValue(item), 0);

const recentOrder = (order, productIds) => {
  const items = matchedSellerItems(order, productIds);
  const names = [...new Set(items.map((item) => item.name).filter(Boolean))];
  return {
    rawId: order.id,
    id: order.order_number || items[0]?.slug || `#${String(order.id || "").slice(0, 8).toUpperCase()}`,
    productNames: names.join(", ") || order.product || "Product",
    date: order.created_at,
    value: items.reduce((sum, item) => sum + itemValue(item), 0),
    status: order.status || "Placed",
  };
};

export const getEarnings = async (req, res, next) => {
  try {
    const period = req.query.period || "thisMonth";
    if (!['thisMonth', 'allTime'].includes(period)) {
      return res.status(400).json({ success: false, message: "period must be thisMonth or allTime" });
    }

    const { orders, productIds } = await getSellerOrders(req.seller.id);
    const now = new Date();
    const thisMonthStart = monthStart(now);
    const selectedOrders = period === "thisMonth"
      ? orders.filter((order) => new Date(order.created_at) >= thisMonthStart)
      : orders;

    // Define business rules: separate active/valid orders from cancelled and returned orders
    const validOrders = selectedOrders.filter((order) => !isExcluded(order.status));
    const cancelledOrders = selectedOrders.filter((order) => isCancelled(order.status));
    const returnedOrders = selectedOrders.filter((order) => isReturned(order.status));

    const trendStarts = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
      return date;
    });
    const trend = trendStarts.map((date) => ({
      month: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(date),
      value: 0,
    }));
    const trendIndex = new Map(trendStarts.map((date, index) => [`${date.getUTCFullYear()}-${date.getUTCMonth()}`, index]));

    // Exclude cancelled and returned orders from 12-month revenue trend
    orders.forEach((order) => {
      if (isExcluded(order.status)) return;
      const date = new Date(order.created_at);
      const index = trendIndex.get(`${date.getUTCFullYear()}-${date.getUTCMonth()}`);
      if (index !== undefined) {
        trend[index].value += orderSellerValue(order, productIds);
      }
    });

    // Net active earnings exclude cancelled and returned orders
    const orderValue = validOrders.reduce(
      (sum, order) => sum + orderSellerValue(order, productIds),
      0,
    );

    // Separately report cancelled and returned values
    const cancelledOrderValue = cancelledOrders.reduce(
      (sum, order) => sum + orderSellerValue(order, productIds),
      0,
    );

    const returnedOrderValue = returnedOrders.reduce(
      (sum, order) => sum + orderSellerValue(order, productIds),
      0,
    );

    const grossOrderValue = selectedOrders.reduce(
      (sum, order) => sum + orderSellerValue(order, productIds),
      0,
    );

    return res.json({
      success: true,
      data: {
        period,
        orderValue,
        orderCount: validOrders.length,
        grossOrderValue,
        grossOrderCount: selectedOrders.length,
        cancelledOrdersCount: cancelledOrders.length,
        cancelledOrderValue,
        returnedOrdersCount: returnedOrders.length,
        returnedOrderValue,
        deductions: {
          cancelled: { count: cancelledOrders.length, value: cancelledOrderValue },
          returned: { count: returnedOrders.length, value: returnedOrderValue },
        },
        recentOrders: orders.slice(0, 10).map((order) => recentOrder(order, productIds)),
        trend,
      },
    });
  } catch (error) {
    return next(error);
  }
};
