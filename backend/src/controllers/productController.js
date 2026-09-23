import { supabase } from "../config/supabase.js";
import { removeProductImages, storagePathFromUrl, uploadProductImages } from "../services/productImageStorage.js";

const table = "seller_products";
const categoriesTable = "categories";

const nullableText = (value) => (value?.trim?.() ? value.trim() : null);
const nullableNumber = (value) => (value === "" || value === undefined ? null : Number(value));
const stockStatusFor = (quantity, threshold) => {
  if (quantity <= 0) return "Out of Stock";
  return quantity <= threshold ? "Low Stock" : "In Stock";
};

const toApiProduct = (product) => ({
  _id: product.id,
  id: product.id,
  sellerId: product.seller_id,
  productId: product.product_id,
  productName: product.product_name,
  category: product.category,
  subCategory: product.sub_category,
  material: product.material,
  weight: product.weight,
  description: product.description,
  benefits: product.benefits,
  highlights: product.highlights,
  dimensions: { length: product.length, width: product.width, height: product.height },
  pricing: { mrp: product.mrp, discountPrice: product.discount_price, sellingPrice: product.selling_price },
  images: { cover: product.cover_image, additional: product.additional_images ?? [] },
  inventory: { sku: product.sku, stockQuantity: product.stock_quantity, lowStockAlert: product.low_stock_alert },
  stockStatus: product.stock_status,
  isActive: product.is_active,
  usage: { howToUse: product.how_to_use, careInstruction: product.care_instruction },
  createdAt: product.created_at,
  updatedAt: product.updated_at,
});

const productId = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = `#VC${Math.floor(10000 + Math.random() * 90000)}`;
    const { data, error } = await supabase.from(table).select("id").eq("product_id", id).maybeSingle();
    if (error) throw error;
    if (!data) return id;
  }
  throw new Error("Could not generate a unique product ID");
};

const productPayload = (body, existing = {}, images = {}) => {
  const stockQuantity = body.stockQuantity === undefined ? existing.stock_quantity : Number(body.stockQuantity || 0);
  const lowStockAlert = body.lowStockAlert === undefined ? existing.low_stock_alert : Number(body.lowStockAlert || 5);
  const payload = {
    product_name: body.productName?.trim(), category: body.category?.trim(), sub_category: nullableText(body.subCategory),
    material: body.material?.trim(), weight: body.weight?.trim(), description: nullableText(body.description),
    benefits: nullableText(body.benefits), highlights: nullableText(body.highlights), length: nullableNumber(body.length),
    width: nullableNumber(body.width), height: nullableNumber(body.height), mrp: nullableNumber(body.mrp),
    discount_price: nullableNumber(body.discountPrice), selling_price: nullableNumber(body.sellingPrice),
    sku: nullableText(body.sku), stock_quantity: stockQuantity, low_stock_alert: lowStockAlert,
    stock_status: stockStatusFor(stockQuantity, lowStockAlert), how_to_use: nullableText(body.howToUse),
    care_instruction: nullableText(body.careInstruction),
  };
  if (images.cover) payload.cover_image = images.cover;
  if (images.additional?.length) payload.additional_images = images.additional;
  return payload;
};

export const createProduct = async (req, res, next) => {
  try {
    const required = ["productName", "category", "material", "weight", "mrp", "sellingPrice"];
    if (required.some((field) => !req.body[field])) {
      return res.status(400).json({ success: false, message: "productName, category, material, weight, mrp and sellingPrice are required" });
    }
    const id = await productId();
    const images = await uploadProductImages(req.files, id);
    const payload = { ...productPayload(req.body, {}, images), product_id: id, seller_id: req.seller.id };
    const { data, error } = await supabase.from(table).insert(payload).select().single();
    if (error) {
      await removeProductImages(images.paths);
      throw error;
    }
    return res.status(201).json({ success: true, data: toApiProduct(data) });
  } catch (error) {
    // A concurrent offer assignment can pass the pre-check just before deletion.
    // Keep the database RESTRICT constraint as the final safety net and preserve
    // the same seller-friendly response in that race.
    if (error.code === "23503") {
      return res.status(409).json({ success: false, message: "This product is used in one or more offers. Remove it from those offers before deleting." });
    }
    return next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    let query = supabase.from(table).select("*", { count: "exact" }).eq("seller_id", req.seller.id).order("created_at", { ascending: false });
    if (req.query.search) {
      const value = req.query.search.replace(/[%_,()]/g, "");
      query = query.or(`product_name.ilike.%${value}%,product_id.ilike.%${value}%`);
    }
    if (req.query.category) query = query.eq("category", req.query.category);
    if (req.query.stockStatus) query = query.eq("stock_status", req.query.stockStatus);
    const { data, count, error } = await query.range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    return res.json({ success: true, data: data.map(toApiProduct), pagination: { total: count ?? 0, page, pages: Math.ceil((count ?? 0) / limit) } });
  } catch (error) { return next(error); }
};

export const getProductStats = async (_req, res, next) => {
  try {
    const counts = await Promise.all([undefined, "In Stock", "Out of Stock", "Low Stock"].map((status) => {
      let query = supabase.from(table).select("id", { count: "exact", head: true }).eq("seller_id", _req.seller.id);
      if (status) query = query.eq("stock_status", status);
      return query;
    }));
    const failed = counts.find(({ error }) => error);
    if (failed) throw failed.error;
    return res.json({ success: true, data: { totalProducts: counts[0].count ?? 0, inStock: counts[1].count ?? 0, outOfStock: counts[2].count ?? 0, lowStock: counts[3].count ?? 0 } });
  } catch (error) { return next(error); }
};

export const getProductCategories = async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from(categoriesTable)
      .select("name")
      .not("name", "is", null)
      .order("name", { ascending: true });
    if (error) throw error;

    const categories = [...new Set(data.map(({ name }) => name?.trim()).filter(Boolean))];
    return res.json({ success: true, data: categories });
  } catch (error) { return next(error); }
};

export const getProductById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from(table).select("*").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, data: toApiProduct(data) });
  } catch (error) { return next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { data: existing, error: fetchError } = await supabase.from(table).select("*").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) return res.status(404).json({ success: false, message: "Product not found" });
    const images = await uploadProductImages(req.files, existing.product_id);
    const { data, error } = await supabase.from(table).update(productPayload(req.body, existing, images)).eq("id", req.params.id).select().single();
    if (error) {
      await removeProductImages(images.paths);
      throw error;
    }
    const replacedUrls = [
      ...(images.cover ? [existing.cover_image] : []),
      ...(images.additional?.length ? existing.additional_images ?? [] : []),
    ];
    await removeProductImages(replacedUrls.map(storagePathFromUrl).filter(Boolean));
    return res.json({ success: true, data: toApiProduct(data) });
  } catch (error) { return next(error); }
};
export const updateProductStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    }
    const { data, error } = await supabase
      .from(table)
      .update({ is_active: isActive })
      .eq("id", req.params.id)
      .eq("seller_id", req.seller.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, data: toApiProduct(data) });
  } catch (error) { return next(error); }
};
export const deleteProduct = async (req, res, next) => {
  try {
    const { data: product, error: productError } = await supabase.from(table).select("id, cover_image, additional_images").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (productError) throw productError;
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const { data: offerLink, error: offerLinkError } = await supabase.from("offer_products").select("id").eq("product_id", product.id).limit(1).maybeSingle();
    if (offerLinkError) throw offerLinkError;
    if (offerLink) return res.status(409).json({ success: false, message: "This product is used in one or more offers. Remove it from those offers before deleting." });
    const { data, error } = await supabase.from(table).delete().eq("id", product.id).eq("seller_id", req.seller.id).select("cover_image, additional_images").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Product not found" });
    await removeProductImages([data.cover_image, ...(data.additional_images ?? [])].map(storagePathFromUrl).filter(Boolean));
    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    // A concurrent offer assignment can pass the pre-check just before deletion.
    // Keep the database RESTRICT constraint as the final safety net and preserve
    // the same seller-friendly response in that race.
    if (error.code === "23503") {
      return res.status(409).json({ success: false, message: "This product is used in one or more offers. Remove it from those offers before deleting." });
    }
    return next(error);
  }
};
