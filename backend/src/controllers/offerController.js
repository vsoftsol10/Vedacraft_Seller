import { supabase } from "../config/supabase.js";

const offersTable = "offers";
const offerProductsTable = "offer_products";
const productsTable = "seller_products";

const apiError = (status, message) => Object.assign(new Error(message), { status });
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const cleanText = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

const normalizeDiscountType = (value) => {
  const type = String(value ?? "").trim().toLowerCase();
  if (type === "percentage") return "percentage";
  if (["fixed", "flat amount", "flat_amount"].includes(type)) return "fixed";
  return null;
};

const normalizeScope = (value) => {
  const scope = String(value ?? "").trim().toLowerCase();
  if (["all", "all_products"].includes(scope)) return "all_products";
  if (["select", "select_products"].includes(scope)) return "select_products";
  return null;
};

const nullableDate = (value, field) => {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw apiError(400, `${field} must be a valid date.`);
  return date.toISOString();
};

const effectiveStatus = (offer) => {
  if (offer.end_date && new Date(offer.end_date).getTime() <= Date.now()) return "Expired";
  return offer.is_active ? "Active" : "Inactive";
};

const toApiOffer = (offer, productIds = []) => ({
  id: offer.id,
  sellerId: offer.seller_id,
  offerName: offer.offer_name,
  description: offer.offer_description,
  discountType: offer.discount_type,
  discountValue: Number(offer.discount_value),
  discountLabel: offer.discount_type === "percentage" ? `${offer.discount_value}% off` : `₹${offer.discount_value} off`,
  scope: offer.scope,
  productIds,
  startDate: offer.start_date,
  endDate: offer.end_date,
  isActive: offer.is_active,
  status: effectiveStatus(offer),
  createdAt: offer.created_at,
  updatedAt: offer.updated_at,
});

const productIdsForOffers = async (offerIds) => {
  if (!offerIds.length) return new Map();
  const { data, error } = await supabase.from(offerProductsTable).select("offer_id, product_id").in("offer_id", offerIds);
  if (error) throw error;
  const byOffer = new Map(offerIds.map((id) => [id, []]));
  for (const row of data ?? []) byOffer.get(row.offer_id)?.push(row.product_id);
  return byOffer;
};

const ownedProducts = async (sellerId, productIds) => {
  const uniqueIds = [...new Set(productIds)];
  if (!uniqueIds.length) throw apiError(400, "Select at least one product.");
  const { data, error } = await supabase.from(productsTable).select("id").eq("seller_id", sellerId).in("id", uniqueIds);
  if (error) throw error;
  if ((data ?? []).length !== uniqueIds.length) {
    throw apiError(400, "One or more selected products do not belong to your seller account.");
  }
  return uniqueIds;
};

const normalizedPayload = (body, existing = {}) => {
  const offerName = cleanText(has(body, "offerName") ? body.offerName : existing.offer_name);
  if (!offerName) throw apiError(400, "offer_name is required.");
  if (offerName.length > 100) throw apiError(400, "offer_name must be 100 characters or fewer.");

  const descriptionValue = has(body, "description") ? body.description : existing.offer_description;
  const description = descriptionValue === null || descriptionValue === undefined ? null : cleanText(descriptionValue);
  if (description?.length > 300) throw apiError(400, "offer_description must be 300 characters or fewer.");

  const discountType = normalizeDiscountType(has(body, "discountType") ? body.discountType : existing.discount_type);
  if (!discountType) throw apiError(400, "discount_type must be percentage or fixed.");
  const discountValue = Number(has(body, "discountValue") ? body.discountValue : existing.discount_value);
  if (!Number.isFinite(discountValue) || discountValue <= 0) throw apiError(400, "discount_value must be greater than 0.");
  if (discountType === "percentage" && discountValue > 100) throw apiError(400, "Percentage discount cannot exceed 100.");

  const scope = normalizeScope(has(body, "scope") ? body.scope : (has(body, "applicableOn") ? body.applicableOn : existing.scope));
  if (!scope) throw apiError(400, "scope must be all_products or select_products.");

  const startRaw = has(body, "startDate") ? body.startDate : existing.start_date;
  const endRaw = has(body, "endDate") ? body.endDate : existing.end_date;
  const startDate = nullableDate(startRaw, "start_date");
  const endDate = nullableDate(endRaw, "end_date");
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
    throw apiError(400, "end_date must be after start_date.");
  }

  return {
    offer_name: offerName,
    offer_description: description || null,
    discount_type: discountType,
    discount_value: discountValue,
    scope,
    start_date: startDate,
    end_date: endDate,
  };
};

const requestedProductIds = (body) => {
  const ids = body.productIds ?? body.selectedProductIds;
  if (ids === undefined) return undefined;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !id.trim())) {
    throw apiError(400, "productIds must be an array of product IDs.");
  }
  return ids;
};

const saveOfferProducts = async (offerId, productIds) => {
  if (!productIds.length) return;
  const { error } = await supabase.from(offerProductsTable).insert(productIds.map((product_id) => ({ offer_id: offerId, product_id })));
  if (error) throw error;
};

export const getOffers = async (req, res, next) => {
  try {
    const { data: offers, error } = await supabase.from(offersTable).select("*").eq("seller_id", req.seller.id).order("created_at", { ascending: false });
    if (error) throw error;
    const productIdsByOffer = await productIdsForOffers((offers ?? []).map((offer) => offer.id));
    return res.json({ success: true, data: (offers ?? []).map((offer) => toApiOffer(offer, productIdsByOffer.get(offer.id) ?? [])) });
  } catch (error) { return next(error); }
};

export const createOffer = async (req, res, next) => {
  try {
    const payload = normalizedPayload(req.body);
    const suppliedProductIds = requestedProductIds(req.body);
    const productIds = payload.scope === "select_products" ? await ownedProducts(req.seller.id, suppliedProductIds ?? []) : [];
    const { data: offer, error } = await supabase.from(offersTable).insert({ ...payload, seller_id: req.seller.id }).select().single();
    if (error) throw error;
    try {
      await saveOfferProducts(offer.id, productIds);
    } catch (error) {
      await supabase.from(offersTable).delete().eq("id", offer.id).eq("seller_id", req.seller.id);
      throw error;
    }
    return res.status(201).json({ success: true, data: toApiOffer(offer, productIds) });
  } catch (error) { return next(error); }
};

export const updateOffer = async (req, res, next) => {
  try {
    const { data: existing, error: findError } = await supabase.from(offersTable).select("*").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (findError) throw findError;
    if (!existing) return res.status(404).json({ success: false, message: "Offer not found" });

    const payload = normalizedPayload(req.body, existing);
    const requestedIds = requestedProductIds(req.body);
    const currentIdsByOffer = await productIdsForOffers([existing.id]);
    const productIds = payload.scope === "select_products"
      ? await ownedProducts(req.seller.id, requestedIds ?? currentIdsByOffer.get(existing.id) ?? [])
      : [];
    const { data: offer, error } = await supabase.from(offersTable).update(payload).eq("id", existing.id).eq("seller_id", req.seller.id).select().single();
    if (error) throw error;
    const { error: deleteLinksError } = await supabase.from(offerProductsTable).delete().eq("offer_id", existing.id);
    if (deleteLinksError) throw deleteLinksError;
    await saveOfferProducts(existing.id, productIds);
    return res.json({ success: true, data: toApiOffer(offer, productIds) });
  } catch (error) { return next(error); }
};

export const toggleOffer = async (req, res, next) => {
  try {
    if (typeof req.body?.isActive !== "boolean") return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    const { data: existing, error: findError } = await supabase.from(offersTable).select("*").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (findError) throw findError;
    if (!existing) return res.status(404).json({ success: false, message: "Offer not found" });
    if (effectiveStatus(existing) === "Expired") return res.status(409).json({ success: false, message: "Expired offers cannot be enabled or disabled." });
    const { data: offer, error } = await supabase.from(offersTable).update({ is_active: req.body.isActive }).eq("id", existing.id).eq("seller_id", req.seller.id).select().single();
    if (error) throw error;
    const productIdsByOffer = await productIdsForOffers([offer.id]);
    return res.json({ success: true, data: toApiOffer(offer, productIdsByOffer.get(offer.id) ?? []) });
  } catch (error) { return next(error); }
};

export const deleteOffer = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from(offersTable).delete().eq("id", req.params.id).eq("seller_id", req.seller.id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Offer not found" });
    return res.json({ success: true, message: "Offer deleted" });
  } catch (error) { return next(error); }
};
