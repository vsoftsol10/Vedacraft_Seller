import { supabase } from "../config/supabase.js";
import { removeProductImages, storagePathFromUrl, uploadProductImages } from "../services/productImageStorage.js";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { automaticTranslationAvailable, translateTexts } from "../services/translationService.js";
const table = "seller_products";
const categoriesTable = "categories";
const translationsTable = "product_translations";
const LANGUAGES = new Set(["en", "ta", "hi"]);
const TRANSLATION_COLUMNS = ["product_name", "material", "description", "benefits", "highlights", "how_to_use", "care_instruction"];
const TRANSLATION_LIMITS = { productName: 200, material: 200, description: 5000, benefits: 5000, highlights: 5000, howToUse: 5000, careInstruction: 5000 };
const TRANSLATION_FIELD_MAP = { productName: "product_name", material: "material", description: "description", benefits: "benefits", highlights: "highlights", howToUse: "how_to_use", careInstruction: "care_instruction" };

const nullableText = (value) => (value?.trim?.() ? value.trim() : null);
const nullableNumber = (value) => (value === "" || value === undefined ? null : Number(value));
const stockStatusFor = (quantity, threshold) => {
  if (quantity <= 0) return "Out of Stock";
  return quantity <= threshold ? "Low Stock" : "In Stock";
};
const REQUIRED_BULK_FIELDS = ["productName", "category", "material", "weight", "mrp", "sellingPrice"];
const BULK_TEMPLATE_COLUMNS = [
  { header: "row_id", example: 1 },
  { header: "product_name", example: "Handcrafted Neem Soap" },
  { header: "category", example: "" },
  { header: "sub_category", example: "Natural Soaps" },
  { header: "material", example: "Neem and coconut oil" },
  { header: "weight", example: "100 g" },
  { header: "description", example: "Gentle handmade soap for everyday use." },
  { header: "benefits", example: "Cleanses and nourishes skin" },
  { header: "highlights", example: "Vegan; handmade" },
  { header: "length", example: 8 },
  { header: "width", example: 6 },
  { header: "height", example: 3 },
  { header: "mrp", example: 199 },
  { header: "discount_price", example: 179 },
  { header: "selling_price", example: 149 },
  { header: "sku", example: "SOAP-NEEM-001" },
  { header: "stock_quantity", example: 25 },
  { header: "low_stock_alert", example: 5 },
  { header: "how_to_use", example: "Wet, lather, and rinse." },
  { header: "care_instructions", example: "Keep dry between uses." },
  { header: "cover_image_filename", example: "neem-soap-cover.jpg" },
  { header: "additional_image_filenames", example: "neem-soap-back.jpg" },
];
const BULK_TEMPLATE_HEADERS = BULK_TEMPLATE_COLUMNS.map(({ header }) => header);
const getCurrentCategories = async () => {
  const { data, error } = await supabase
    .from(categoriesTable)
    .select("name")
    .not("name", "is", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return [...new Set(data.map(({ name }) => name?.trim()).filter(Boolean))];
};
const hasText = (value) => typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;
const languageFrom = (value) => LANGUAGES.has(value) ? value : "en";
const translationPayload = (body = {}, source = "manual", status = "ok") => ({ product_name: nullableText(body.productName), material: nullableText(body.material), description: nullableText(body.description), benefits: nullableText(body.benefits), highlights: nullableText(body.highlights), how_to_use: nullableText(body.howToUse), care_instruction: nullableText(body.careInstruction), source, status });
const translationForApi = (row) => row && ({ language: row.language, productName: row.product_name, material: row.material, description: row.description, benefits: row.benefits, highlights: row.highlights, howToUse: row.how_to_use, careInstruction: row.care_instruction, source: row.source, status: row.status || "ok" });
const applyTranslation = (product, translation) => {
  if (!translation) return product;
  const next = { ...product };
  TRANSLATION_COLUMNS.forEach((column) => { if (hasText(translation[column])) next[column] = translation[column]; });
  return next;
};
const toApiProduct = (product, { availableLanguages = [], requestedLanguage = null } = {}) => ({
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
  primaryLanguage: languageFrom(product.primary_language),
  availableLanguages: [...new Set([languageFrom(product.primary_language), ...availableLanguages])],
  language: requestedLanguage || languageFrom(product.primary_language),
});
const parseTranslations = (raw) => {
  if (!raw) return {};
  try { const parsed = typeof raw === "string" ? JSON.parse(raw) : raw; return parsed && typeof parsed === "object" ? parsed : {}; }
  catch { const error = new Error("translations must be valid JSON"); error.status = 400; throw error; }
};
const validateTranslation = (content = {}) => {
  for (const [field, limit] of Object.entries(TRANSLATION_LIMITS)) {
    if (typeof content[field] === "string" && content[field].length > limit) {
      const error = new Error(`${field} must be ${limit} characters or fewer`);
      error.status = 400;
      throw error;
    }
  }
};
const upsertTranslations = async (productId, rawTranslations) => {
  const translations = parseTranslations(rawTranslations);
  for (const [language, content] of Object.entries(translations)) {
    if (!LANGUAGES.has(language) || !content || typeof content !== "object") continue;
    validateTranslation(content);
    const payload = translationPayload(content);
    const populated = Object.entries(payload).some(([key, value]) => key !== "source" && hasText(value));
    const query = supabase.from(translationsTable);
    const { error } = populated
      ? await query.upsert({ product_id: productId, language, ...payload }, { onConflict: "product_id,language" })
      : await query.delete().eq("product_id", productId).eq("language", language);
    if (error) throw error;
  }
};
const readTranslations = async (productId) => {
  const { data, error } = await supabase.from(translationsTable).select("*").eq("product_id", productId);
  if (error) throw error;
  return data ?? [];
};
const listValues = (value) => { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : null; } catch { return null; } };
const productTranslationContent = (product, columns = TRANSLATION_COLUMNS) => Object.fromEntries(Object.entries(TRANSLATION_FIELD_MAP).filter(([, column]) => columns.includes(column)).map(([field, column]) => [field, product[column] ?? ""]));
const autoTranslateProduct = async (product, { columns = TRANSLATION_COLUMNS, force = false } = {}) => {
  if (!automaticTranslationAvailable()) return { disabled: true, warnings: ["Automatic translation is not set up"] };
  const sourceLanguage = languageFrom(product.primary_language); const existing = await readTranslations(product.id); const warnings = [];
  for (const targetLanguage of [...LANGUAGES].filter((language) => language !== sourceLanguage)) {
    const current = existing.find((translation) => translation.language === targetLanguage);
    if (current?.source === "manual" && !force) continue;
    const content = productTranslationContent(product, columns); const texts = []; const slots = [];
    Object.entries(content).forEach(([field, value]) => { const list = listValues(value); if (list) list.forEach((item, index) => { if (hasText(item)) { slots.push([field, index, list]); texts.push(item); } }); else if (hasText(value)) { slots.push([field, null, null]); texts.push(value); } });
    if (!texts.length) continue;
    try {
      const results = await translateTexts({ texts, sourceLang: sourceLanguage, targetLang: targetLanguage }); const translated = {};
      slots.forEach(([field, index, list], resultIndex) => { if (index === null) translated[field] = results[resultIndex]; else { const next = translated[field] ? JSON.parse(translated[field]) : [...list]; next[index] = results[resultIndex]; translated[field] = JSON.stringify(next); } });
      const payload = translationPayload(translated, "auto", "ok");
      const { error } = await supabase.from(translationsTable).upsert({ product_id: product.id, language: targetLanguage, ...payload }, { onConflict: "product_id,language" }); if (error) throw error;
    } catch (error) { warnings.push(`${targetLanguage}: ${error.code || "translation failed"}`); await supabase.from(translationsTable).upsert({ product_id: product.id, language: targetLanguage, source: current?.source || "auto", status: "failed" }, { onConflict: "product_id,language" }); }
  }
  return { disabled: false, warnings };
};
const applyListFilters = (query, queryParams) => {
  let filtered = query;
  if (queryParams.search) { const value = queryParams.search.replace(/[%_,()]/g, ""); filtered = filtered.or(`product_name.ilike.%${value}%,product_id.ilike.%${value}%,sku.ilike.%${value}%`); }
  if (queryParams.category) filtered = filtered.eq("category", queryParams.category);
  if (["active", "inactive"].includes(queryParams.isActive)) filtered = filtered.eq("is_active", queryParams.isActive === "active");
  if (queryParams.stockStatus) filtered = filtered.eq("stock_status", queryParams.stockStatus);
  return filtered;
};
const restoreTranslations = async (productId, rows) => {
  const { error: deleteError } = await supabase.from(translationsTable).delete().eq("product_id", productId);
  if (deleteError) throw deleteError;
  if (!rows.length) return;
  const payload = rows.map(({ id, created_at, updated_at, ...row }) => ({ ...row, product_id: productId }));
  const { error } = await supabase.from(translationsTable).insert(payload);
  if (error) throw error;
};
const publicProduct = (product) => ({
  id: product.id, productId: product.product_id, productName: product.product_name,
  category: product.category, subCategory: product.sub_category, material: product.material,
  weight: product.weight, description: product.description, benefits: product.benefits,
  highlights: product.highlights, dimensions: { length: product.length, width: product.width, height: product.height },
  pricing: { mrp: product.mrp, discountPrice: product.discount_price, sellingPrice: product.selling_price },
  images: { cover: product.cover_image, additional: product.additional_images ?? [] },
  usage: { howToUse: product.how_to_use, careInstruction: product.care_instruction },
  primaryLanguage: languageFrom(product.primary_language),
});
const sheetRowToBody = (row) => ({
  productName: row.product_name?.toString().trim(),
  category: row.category?.toString().trim(),
  subCategory: row.sub_category,
  material: row.material?.toString().trim(),
  weight: row.weight?.toString().trim(),
  description: row.description,
  benefits: row.benefits,
  highlights: row.highlights,
  length: row.length,
  width: row.width,
  height: row.height,
  mrp: row.mrp,
  discountPrice: row.discount_price,
  sellingPrice: row.selling_price,
  sku: row.sku,
  stockQuantity: row.stock_quantity,
  lowStockAlert: row.low_stock_alert,
  howToUse: row.how_to_use,
  careInstruction: row.care_instructions,
  coverImageFilename: row.cover_image_filename?.toString().trim(),
  additionalImageFilenames: row.additional_image_filenames?.toString().trim(),
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

// SKU format: first three letters of the product name, followed by a
// zero-padded sequence (for example, "Neem Soap" becomes "NEE-0001").
const skuPrefixFor = (productName) => {
  const letters = String(productName ?? "").toUpperCase().replace(/[^A-Z]/g, "");
  return letters.slice(0, 3).padEnd(3, "X");
};

const nextSkuFor = async (productName) => {
  const prefix = skuPrefixFor(productName);
  const { data, error } = await supabase.from(table).select("sku").ilike("sku", `${prefix}-%`);
  if (error) throw error;

  const largestSequence = (data ?? []).reduce((largest, { sku }) => {
    const match = new RegExp(`^${prefix}-(\\d+)$`, "i").exec(sku ?? "");
    return match ? Math.max(largest, Number(match[1])) : largest;
  }, 0);

  return `${prefix}-${String(largestSequence + 1).padStart(4, "0")}`;
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
    let data;
    let error;
    // Generate this on the server rather than trusting the preview in the form.
    // Retry if another request claimed the same next sequence between lookup and insert.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const sku = await nextSkuFor(req.body.productName);
      const payload = { ...productPayload({ ...req.body, sku }, {}, images), product_id: id, seller_id: req.seller.id, primary_language: languageFrom(req.body.primaryLanguage) };
      ({ data, error } = await supabase.from(table).insert(payload).select().single());
      if (!error || !(error.code === "23505" && /sku/i.test(error.message ?? ""))) break;
    }
    if (error) {
      await removeProductImages(images.paths);
      throw error;
    }
    const translationResult = await autoTranslateProduct(data);
    return res.status(201).json({ success: true, data: toApiProduct(data), translation: translationResult });
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
    const query = applyListFilters(supabase.from(table).select("*", { count: "exact" }).eq("seller_id", req.seller.id).order("created_at", { ascending: false }), req.query);
    const result = await query.range((page - 1) * limit, page * limit - 1);
    if (result.error) throw result.error;
    const data = result.data ?? [];
    const count = result.count ?? data.length;
    return res.json({ success: true, data: data.map((product) => toApiProduct(product)), pagination: { total: count, page, pages: Math.ceil(count / limit) } });
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
    const categories = await getCurrentCategories();
    return res.json({ success: true, data: categories });
  } catch (error) { return next(error); }
};

export const getProductById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from(table).select("*").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Product not found" });
    const translations = await readTranslations(data.id);
    const requestedLanguage = LANGUAGES.has(req.query.lang) ? req.query.lang : languageFrom(data.primary_language);
    const selected = translations.find((translation) => translation.language === requestedLanguage);
    return res.json({ success: true, data: toApiProduct(applyTranslation(data, selected), { availableLanguages: translations.map(({ language }) => language), requestedLanguage }), translations: translations.map(translationForApi) });
  } catch (error) { return next(error); }
};

// Storefronts may use this read-only endpoint. It exposes only active products
// and never accepts or returns a seller identity as an authorization input.
export const getPublicProductById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from(table).select("*").eq("id", req.params.id).eq("is_active", true).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Product not found" });
    const translations = await readTranslations(data.id);
    const requestedLanguage = LANGUAGES.has(req.query.lang) ? req.query.lang : languageFrom(data.primary_language);
    const selected = translations.find((translation) => translation.language === requestedLanguage);
    const product = publicProduct(applyTranslation(data, selected));
    product.availableLanguages = [...new Set([languageFrom(data.primary_language), ...translations.map(({ language }) => language)])];
    product.language = requestedLanguage;
    return res.json({ success: true, data: product });
  } catch (error) { return next(error); }
};

export const getProductTranslations = async (req, res, next) => {
  try {
    const { data: product, error } = await supabase.from(table).select("id, primary_language").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (error) throw error;
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const translations = await readTranslations(product.id);
    return res.json({ success: true, data: { primaryLanguage: languageFrom(product.primary_language), translations: translations.map(translationForApi) } });
  } catch (error) { return next(error); }
};

export const saveProductTranslation = async (req, res, next) => {
  try {
    const language = req.params.language;
    if (!LANGUAGES.has(language)) return res.status(400).json({ success: false, message: "Unsupported language" });
    const { data: product, error } = await supabase.from(table).select("id, primary_language").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (error) throw error;
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (language === languageFrom(product.primary_language)) return res.status(400).json({ success: false, message: "Edit the primary-language product fields directly" });
    await upsertTranslations(product.id, { [language]: req.body });
    const translations = await readTranslations(product.id);
    return res.json({ success: true, data: translations.map(translationForApi) });
  } catch (error) { return next(error); }
};

export const retryProductTranslations = async (req, res, next) => {
  try {
    const { data: product, error } = await supabase.from(table).select("*").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (error) throw error;
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const characterCount = TRANSLATION_COLUMNS.reduce((total, column) => total + String(product[column] ?? "").length, 0);
    if (characterCount > 25_000) return res.status(400).json({ success: false, message: "Product text exceeds the 25,000 character translation limit." });
    const result = await autoTranslateProduct(product, { force: req.query.force === "true" });
    return res.json({ success: true, data: result });
  } catch (error) { return next(error); }
};

export const translateMissingProducts = async (req, res, next) => {
  try {
    const { data: products, error } = await supabase.from(table).select("*").eq("seller_id", req.seller.id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    let translated = 0; let skipped = 0; let failed = 0;
    for (const product of products) {
      const rows = await readTranslations(product.id);
      const missing = [...LANGUAGES].some((language) => language !== languageFrom(product.primary_language) && !rows.some((row) => row.language === language));
      if (!missing) { skipped += 1; continue; }
      const result = await autoTranslateProduct(product);
      if (result.disabled || result.warnings.length) failed += 1; else translated += 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return res.json({ success: true, data: { translated, skipped, failed } });
  } catch (error) { return next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { data: existing, error: fetchError } = await supabase.from(table).select("*").eq("id", req.params.id).eq("seller_id", req.seller.id).maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) return res.status(404).json({ success: false, message: "Product not found" });
    const translationSnapshot = await readTranslations(existing.id);
    const images = await uploadProductImages(req.files, existing.product_id);
    const primaryLanguage = languageFrom(req.body.primaryLanguage || existing.primary_language);
    // Preserve the old primary copy before assigning a new primary language.
    // The form submits the edited text as the new primary-language content.
    if (primaryLanguage !== languageFrom(existing.primary_language)) {
      await upsertTranslations(existing.id, { [languageFrom(existing.primary_language)]: {
        productName: existing.product_name, material: existing.material, description: existing.description,
        benefits: existing.benefits, highlights: existing.highlights, howToUse: existing.how_to_use,
        careInstruction: existing.care_instruction,
      } });
    }
    const changedPayload = { ...productPayload(req.body, existing, images), primary_language: primaryLanguage };
    const { data, error } = await supabase.from(table).update(changedPayload).eq("id", req.params.id).eq("seller_id", req.seller.id).select().single();
    if (error) {
      await restoreTranslations(existing.id, translationSnapshot);
      await removeProductImages(images.paths);
      throw error;
    }
    const replacedUrls = [
      ...(images.cover ? [existing.cover_image] : []),
      ...(images.additional?.length ? existing.additional_images ?? [] : []),
    ];
    await removeProductImages(replacedUrls.map(storagePathFromUrl).filter(Boolean));
    const changedColumns = TRANSLATION_COLUMNS.filter((column) => data[column] !== existing[column]);
    const translationResult = changedColumns.length ? await autoTranslateProduct(data, { columns: changedColumns, force: req.body.forceRetranslate === "true" }) : { disabled: !automaticTranslationAvailable(), warnings: [] };
    return res.json({ success: true, data: toApiProduct(data), translation: translationResult });
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

export const getNextProductSku = async (req, res, next) => {
  try {
    if (!req.query.productName?.trim()) {
      return res.status(400).json({ success: false, message: "productName is required" });
    }
    return res.json({ success: true, data: { sku: await nextSkuFor(req.query.productName) } });
  } catch (error) { return next(error); }
};

export const bulkAddStock = async (req, res, next) => {
  try {
    const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
    if (!updates.length) return res.status(400).json({ success: false, message: "Select at least one product and enter a quantity." });

    const result = [];
    for (const update of updates) {
      const quantity = Number(update.quantity);
      if (!update.id || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: "Each stock quantity must be a whole number greater than zero." });
      }
      const { data: existing, error: findError } = await supabase
        .from(table).select("*").eq("id", update.id).eq("seller_id", req.seller.id).maybeSingle();
      if (findError) throw findError;
      if (!existing) return res.status(404).json({ success: false, message: "One of the selected products was not found." });

      const stockQuantity = Number(existing.stock_quantity || 0) + quantity;
      const { data, error } = await supabase
        .from(table)
        .update({ stock_quantity: stockQuantity, stock_status: stockStatusFor(stockQuantity, existing.low_stock_alert) })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      result.push(toApiProduct(data));
    }
    return res.json({ success: true, data: result });
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

export const downloadBulkTemplate = async (_req, res, next) => {
  try {
    const categories = await getCurrentCategories();
    const workbook = new ExcelJS.Workbook();
    const productsSheet = workbook.addWorksheet("Bulk Products");
    const instructionsSheet = workbook.addWorksheet("Instructions");
    const categorySheet = workbook.addWorksheet("Category Values");
    categorySheet.state = "hidden";
    categorySheet.getColumn(1).values = categories;

    productsSheet.addRow(BULK_TEMPLATE_HEADERS);
    productsSheet.addRow(BULK_TEMPLATE_COLUMNS.map(({ header, example }) =>
      header === "category" ? categories[0] || "" : example));
    // Google Sheets imports direct range formulas more consistently than named ranges.
    // Keep one contiguous rule so Excel and Google Sheets apply it uniformly to rows 2-1000.
    productsSheet.dataValidations.add("C2:C1000", {
      type: "list",
      allowBlank: false,
      formulae: [`'Category Values'!$A$1:$A$${Math.max(categories.length, 1)}`],
      showErrorMessage: true,
      errorTitle: "Invalid category",
      error: "Select a category from the dropdown.",
    });
    productsSheet.getRow(1).font = { bold: true };
    instructionsSheet.addRows([
      ["Bulk product upload instructions"],
      ["Fill the Bulk Products sheet and replace the sample row before uploading."],
      ["The category column only accepts the valid categories listed below."],
      ["The cover_image_filename and additional_image_filenames values must exactly match uploaded image filenames (case-sensitive)."],
      ["Use numbers without currency symbols for mrp, discount_price, selling_price, length, width, height, stock_quantity, and low_stock_alert."],
      [],
      ["Valid categories"],
      ...categories.map((category) => [category]),
    ]);
    instructionsSheet.getColumn(1).width = 110;
    instructionsSheet.getCell("A1").font = { bold: true };
    instructionsSheet.getCell("A7").font = { bold: true };
    const file = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="bulk-product-upload-template.xlsx"');
    return res.send(file);
  } catch (error) {
    return next(error);
  }
};
export const bulkPreviewProducts = async (req, res, next) => {
  try {
    const sheetFile = req.files?.sheet?.[0];
    const imageFiles = req.files?.images || [];
    if (!sheetFile) {
      return res.status(400).json({ success: false, message: "No sheet uploaded" });
    }

    const workbook = XLSX.read(sheetFile.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames.includes("Bulk Products")
      ? "Bulk Products"
      : workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    const imageMap = new Map(imageFiles.map((f) => [f.originalname, f]));
    const categories = await getCurrentCategories();
    const preview = [];

    for (const row of rawRows) {
      const errors = [];
      const body = sheetRowToBody(row);

      REQUIRED_BULK_FIELDS.forEach((field) => {
        if (!body[field]) errors.push(`${field} is required`);
      });
      if (body.category && !categories.includes(body.category)) {
        errors.push(`category must be one of: ${categories.join(", ") || "no categories are currently configured"}`);
      }

      const coverFile = imageMap.get(body.coverImageFilename);
      if (!coverFile) errors.push(`Cover image "${body.coverImageFilename}" not found`);

      const additionalNames = String(body.additionalImageFilenames || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const missingAdditional = additionalNames.filter((n) => !imageMap.has(n));
      if (missingAdditional.length) {
        errors.push(`Additional image(s) not found: ${missingAdditional.join(", ")}`);
      }

      preview.push({
        rowId: row.row_id,
        body,               // camelCase fields, ready to hand straight to productPayload() on confirm
        productId: null,
        images: null,
        errors,
        isValid: errors.length === 0,
      });
    }

    return res.json({ success: true, data: preview });
  } catch (error) {
    return next(error);
  }
};

export const bulkConfirmProducts = async (req, res, next) => {
  try {
    let { rows } = req.body;
    try {
      rows = typeof rows === "string" ? JSON.parse(rows) : rows;
    } catch {
      return res.status(400).json({ success: false, message: "Rows must be valid JSON" });
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "No rows to import" });
    }

    const results = { success: [], failed: [] };
    const imageMap = new Map((req.files?.images || []).map((file) => [file.originalname, file]));

    for (const row of rows) {
      let images = null;
      try {
        const coverFile = imageMap.get(row.body?.coverImageFilename);
        const additionalNames = String(row.body?.additionalImageFilenames || "")
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean);
        if (!coverFile || additionalNames.some((name) => !imageMap.has(name))) {
          throw new Error("Row is missing one or more matched image files — re-run preview");
        }
        const id = await productId();
        images = await uploadProductImages({
          coverImage: [coverFile],
          additionalImages: additionalNames.map((name) => imageMap.get(name)),
        }, id);

        const payload = {
          ...productPayload(row.body, {}, images),
          product_id: id,
          seller_id: req.seller.id,
        };

        const { data, error } = await supabase.from(table).insert(payload).select().single();
        if (error) {
          throw error;
        }

        results.success.push({ rowId: row.rowId, product: toApiProduct(data) });
      } catch (rowErr) {
        if (images) await removeProductImages(images.paths);
        results.failed.push({ rowId: row.rowId ?? "unknown", errors: [rowErr.message] });
      }
    }

    return res.json({ success: true, data: results });
  } catch (error) {
    return next(error);
  }
};
