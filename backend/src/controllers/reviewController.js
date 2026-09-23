import { supabase } from "../config/supabase.js";

const reviewsTable = "product_reviews";
const productsTable = "seller_products";
const profilesTable = "profiles";

const asPositiveInteger = (value, fallback, max) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return Math.min(number, max);
};

const escapeLike = (value) => String(value).replace(/[%_,()]/g, "").trim();

const sellerProducts = async (sellerId) => {
  const { data, error } = await supabase
    .from(productsTable)
    .select("id, product_id, product_name, cover_image")
    .eq("seller_id", sellerId);
  if (error) throw error;
  return data ?? [];
};

const profilesFor = async (userIds) => {
  const ids = [...new Set(userIds.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)))];
  if (!ids.length) return new Map();

  const { data, error } = await supabase.from(profilesTable).select("id, full_name").in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((profile) => [profile.id, profile.full_name?.trim() || "Verified Buyer"]));
};

const toReview = (review, productsById, profilesById) => ({
  id: review.id,
  productId: review.product_id,
  // Product details are taken from the seller-owned product record, never from
  // a value supplied with the review.
  productName: productsById.get(review.product_id)?.name ?? review.product_name ?? null,
  productCode: productsById.get(review.product_id)?.code ?? null,
  productImage: productsById.get(review.product_id)?.image ?? null,
  rating: review.rating,
  title: null,
  reviewText: review.comment ?? null,
  customerName: profilesById.get(review.user_id) ?? "Verified Buyer",
  imageUrls: review.image_urls ?? [],
  createdAt: review.created_at,
  sellerResponse: null,
});

const reviewQuery = (productIds, rating, search) => {
  let query = supabase
    .from(reviewsTable)
    .select("id, user_id, product_id, product_name, rating, comment, image_urls, created_at", { count: "exact" })
    .in("product_id", productIds)
    .order("created_at", { ascending: false });
  if (rating !== undefined) query = query.eq("rating", rating);
  if (search) query = query.ilike("comment", `%${search}%`);
  return query;
};

export const getReviews = async (req, res, next) => {
  try {
    const page = asPositiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = asPositiveInteger(req.query.limit, 10, 100);
    const rating = req.query.rating === undefined ? undefined : Number(req.query.rating);
    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: "rating must be an integer from 1 to 5." });
    }

    const products = await sellerProducts(req.seller.id);
    const productsById = new Map(products.map((product) => [product.id, {
      name: product.product_name,
      code: product.product_id,
      image: product.cover_image,
    }]));
    let productIds = products.map((product) => product.id);
    if (req.query.productId) productIds = productsById.has(req.query.productId) ? [req.query.productId] : [];
    if (!productIds.length) {
      return res.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const search = escapeLike(req.query.search ?? "").slice(0, 200);
    // Customer-name search requires the profile join, which is not a declared DB FK.
    // Fetch the seller-scoped reviews first so the ownership condition always applies.
    if (search) {
      const { data: matchingProfiles, error: profileSearchError } = await supabase
        .from(profilesTable)
        .select("id, full_name")
        .ilike("full_name", `%${search}%`);
      if (profileSearchError) throw profileSearchError;

      const { data: reviews, error } = await reviewQuery(productIds, rating).range(0, 99999);
      if (error) throw error;
      const profilesById = await profilesFor(reviews.map((review) => review.user_id));
      const matchingProfileIds = new Set((matchingProfiles ?? []).map((profile) => profile.id));
      const matchingProductIds = new Set(products
        .filter((product) => `${product.product_name} ${product.product_id}`.toLowerCase().includes(search.toLowerCase()))
        .map((product) => product.id));
      const filtered = reviews.filter((review) =>
        review.comment?.toLowerCase().includes(search.toLowerCase())
        || matchingProfileIds.has(review.user_id)
        || matchingProductIds.has(review.product_id),
      );
      const total = filtered.length;
      const data = filtered.slice((page - 1) * limit, page * limit).map((review) => toReview(review, productsById, profilesById));
      return res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    const { data: reviews, count, error } = await reviewQuery(productIds, rating).range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    const profilesById = await profilesFor(reviews.map((review) => review.user_id));
    const total = count ?? 0;
    return res.json({
      success: true,
      data: reviews.map((review) => toReview(review, productsById, profilesById)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { return next(error); }
};

export const getReviewStats = async (req, res, next) => {
  try {
    const products = await sellerProducts(req.seller.id);
    const productIds = products.map((product) => product.id);
    if (!productIds.length) {
      return res.json({ success: true, data: { averageRating: 0, totalReviews: 0, ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } });
    }

    const { data: reviews, error } = await supabase.from(reviewsTable).select("rating").in("product_id", productIds);
    if (error) throw error;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingTotal = 0;
    for (const review of reviews) {
      if (Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5) {
        ratingBreakdown[review.rating] += 1;
        ratingTotal += review.rating;
      }
    }
    const totalReviews = reviews.length;
    return res.json({
      success: true,
      data: { averageRating: totalReviews ? Number((ratingTotal / totalReviews).toFixed(2)) : 0, totalReviews, ratingBreakdown },
    });
  } catch (error) { return next(error); }
};
