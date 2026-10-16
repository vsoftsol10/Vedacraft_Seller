import { supabase } from "../config/supabase.js";

const offersTable = "offers";
const offerProductsTable = "offer_products";
const productsTable = "seller_products";

const apiError = (status, message) => Object.assign(new Error(message), { status });
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const cleanText = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
const kolkataDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
const dateOnlyInKolkata = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(kolkataDateFormatter.formatToParts(date).filter(({ type }) => type !== "literal").map(({ type, value: part }) => [type, part]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const todayInKolkata = () => dateOnlyInKolkata(new Date());
const isDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "")) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
const asKolkataDateTime = (date, endOfDay = false) => new Date(`${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`).toISOString();

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
  if (offer.end_date && dateOnlyInKolkata(offer.end_date) < todayInKolkata()) return "Expired";
  if (offer.start_date && dateOnlyInKolkata(offer.start_date) > todayInKolkata()) return "Upcoming";
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

// A product may be discounted by only one active offer. An active "all
// products" offer therefore excludes every other active offer for that seller.
const assertNoActiveOfferConflict = async (sellerId, scope, productIds, excludeOfferId = null) => {
  const { data: offers, error } = await supabase
    .from(offersTable)
    .select("id, scope, is_active, end_date")
    .eq("seller_id", sellerId)
    .eq("is_active", true);
  if (error) throw error;

  const activeOffers = (offers ?? []).filter((offer) => offer.id !== excludeOfferId && effectiveStatus(offer) === "Active");
  if (!activeOffers.length) return;
  if (scope === "all_products") {
    throw apiError(409, "An active offer already exists. End or disable it before creating an all-products offer.");
  }
  if (activeOffers.some((offer) => offer.scope === "all_products")) {
    throw apiError(409, "These products are already included in an active all-products offer.");
  }

  const activeOfferIds = activeOffers.map((offer) => offer.id);
  const { data: links, error: linksError } = await supabase.from(offerProductsTable).select("product_id").in("offer_id", activeOfferIds).in("product_id", productIds);
  if (linksError) throw linksError;
  if (links?.length) throw apiError(409, "One or more selected products are already in another active offer.");
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
    await assertNoActiveOfferConflict(req.seller.id, payload.scope, productIds);
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

export const reuseOffer = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body ?? {};
    const today = todayInKolkata();
    if (!isDateOnly(startDate)) throw apiError(400, "Start date is required and must be a valid date.");
    if (!isDateOnly(endDate)) throw apiError(400, "End date is required and must be a valid date.");
    if (startDate < today) throw apiError(400, "Start date cannot be in the past.");
    if (endDate < startDate) throw apiError(400, "End date must be on or after the start date.");
    if (endDate <= today) throw apiError(400, "End date must be in the future.");

    const { data: existing, error: findError } = await supabase.from(offersTable).select("*").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (findError) throw findError;
    if (!existing) return res.status(404).json({ success: false, message: "Offer not found" });
    if (effectiveStatus(existing) !== "Expired") throw apiError(400, "Only expired offers can be reused");

    const currentIdsByOffer = await productIdsForOffers([existing.id]);
    const sourceProductIds = currentIdsByOffer.get(existing.id) ?? [];
    let productIds = [];
    if (existing.scope === "select_products") {
      const { data: availableProducts, error: productsError } = await supabase.from(productsTable).select("id").eq("seller_id", req.seller.id).in("id", sourceProductIds);
      if (productsError) throw productsError;
      productIds = (availableProducts ?? []).map((product) => product.id);
      if (!productIds.length) throw apiError(400, "None of this offer's selected products are available to reuse.");
    }

    const isActive = startDate <= today;
    if (isActive) await assertNoActiveOfferConflict(req.seller.id, existing.scope, productIds);
    const payload = {
      seller_id: req.seller.id,
      offer_name: existing.offer_name,
      offer_description: existing.offer_description,
      discount_type: existing.discount_type,
      discount_value: existing.discount_value,
      scope: existing.scope,
      start_date: asKolkataDateTime(startDate),
      end_date: asKolkataDateTime(endDate, true),
      is_active: isActive,
    };
    const { data: offer, error } = await supabase.from(offersTable).insert(payload).select().single();
    if (error) throw error;
    try {
      await saveOfferProducts(offer.id, productIds);
    } catch (saveError) {
      await supabase.from(offersTable).delete().eq("id", offer.id).eq("seller_id", req.seller.id);
      throw saveError;
    }
    return res.status(201).json({ success: true, data: toApiOffer(offer, productIds) });
  } catch (error) { return next(error); }
};

export const extendOffer = async (req, res, next) => {
  try {
    const { endDate } = req.body ?? {};
    if (!isDateOnly(endDate)) throw apiError(400, "End date is required and must be a valid date.");

    const { data: existing, error: findError } = await supabase.from(offersTable).select("*").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (findError) throw findError;
    if (!existing) return res.status(404).json({ success: false, message: "Offer not found" });

    const today = todayInKolkata();
    const currentStartDate = dateOnlyInKolkata(existing.start_date);
    const currentEndDate = dateOnlyInKolkata(existing.end_date);
    if (!existing.is_active || !currentStartDate || !currentEndDate || currentStartDate > today || currentEndDate < today) {
      throw apiError(400, "Only active offers can be extended");
    }
    if (endDate <= currentEndDate) throw apiError(400, "End date must be later than the current end date.");

    const { data: offer, error } = await supabase
      .from(offersTable)
      .update({ end_date: asKolkataDateTime(endDate, true) })
      .eq("id", existing.id)
      .eq("seller_id", req.seller.id)
      .select()
      .single();
    if (error) throw error;
    const productIdsByOffer = await productIdsForOffers([offer.id]);
    return res.json({ success: true, data: toApiOffer(offer, productIdsByOffer.get(offer.id) ?? []) });
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
    if (existing.is_active) await assertNoActiveOfferConflict(req.seller.id, payload.scope, productIds, existing.id);
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
    if (req.body.isActive) {
      const currentIdsByOffer = await productIdsForOffers([existing.id]);
      await assertNoActiveOfferConflict(req.seller.id, existing.scope, currentIdsByOffer.get(existing.id) ?? [], existing.id);
    }
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
