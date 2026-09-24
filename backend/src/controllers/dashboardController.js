import { getDashboard } from "../services/dashboardService.js";

export const getDashboardSummary = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await getDashboard(req.seller.id) });
  } catch (error) {
    return next(error);
  }
};
