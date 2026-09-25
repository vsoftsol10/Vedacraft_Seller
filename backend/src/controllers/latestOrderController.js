import { getSellerOrders } from "../services/sellerOrders.js";

// This intentionally reuses the existing seller ownership matcher without changing
// the Orders page endpoint or its response. The small response is for header polling.
export const getLatestOrder = async (req, res, next) => {
  try {
    const { orders } = await getSellerOrders(req.seller.id);
    const latest = orders[0];
    return res.json({
      success: true,
      data: latest ? { id: latest.id, createdAt: latest.created_at } : null,
    });
  } catch (error) {
    return next(error);
  }
};
