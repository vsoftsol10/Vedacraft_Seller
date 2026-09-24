import { supabase } from "../config/supabase.js";
import { removeProductImages, storagePathFromUrl, uploadProductImages } from "../services/productImageStorage.js";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
const table = "seller_products";
const categoriesTable = "categories";

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
    const categories = await getCurrentCategories();
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
