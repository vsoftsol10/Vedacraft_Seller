import * as insightsService from "../services/insightservices.js";

export async function getStats(req, res, next) {
  try {
    const sellerId = req.seller.id;
    const stats = await insightsService.getOrderStats(sellerId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getSummary(req, res, next) {
  try {
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    const summary = await insightsService.getInsightSummary(req.seller.id, year);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function getOrderTrends(req, res, next) {
  try {
    const sellerId = req.seller.id;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    const trends = await insightsService.getOrderTrends(sellerId, year);
    res.json(trends);
  } catch (err) {
    next(err);
  }
}

export async function getTopSellingProducts(req, res, next) {
  try {
    const sellerId = req.seller.id;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 3;
    const products = await insightsService.getTopSellingProducts(sellerId, limit);
    res.json(products);
  } catch (err) {
    next(err);
  }
}

export async function getBusinessTips(req, res, next) {
  try {
    const sellerId = req.seller.id;
    const tips = await insightsService.getBusinessTips(sellerId);
    res.json(tips);
  } catch (err) {
    next(err);
  }
}

