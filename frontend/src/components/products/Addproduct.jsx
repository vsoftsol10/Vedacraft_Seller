// src/components/products/Addproduct.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { createProduct, getProductById, getProductCategories, updateProduct } from "../../api/productapi";
import { FORM_ERROR_BANNER } from "../../constants/ui";

/* ---------- Tailwind class constants ---------- */
const PAGE = "max-w-[1100px]";
const BACK_LINK =
  "sticky top-[68px] z-10 mb-5 flex w-full cursor-pointer items-center gap-2 border-b border-[#ececec] bg-[#fafafa] py-4 text-[20px] font-bold shadow-[0_8px_14px_-18px_rgba(0,0,0,0.45)]";
const FORM = "pb-[88px]";

const CARD = "mb-5 rounded-xl border border-[#eee] bg-white p-6";
const CARD_TITLE = "mb-4 text-[16px]";
const SUB_HEADING = "mt-2 mb-3 text-[14px] text-[#444]";
const GRID_2 = "mb-4 grid grid-cols-[1fr_1fr] gap-5";
const GRID_3 = "mb-4 grid grid-cols-[repeat(3,1fr)] gap-5";

const FIELD = "mb-1 flex flex-col gap-1.5";
const FIELD_LABEL = "text-[13px] font-semibold text-[#333]";
const REQUIRED = "text-[#d9534f]";
const INPUT =
  "rounded-lg border border-[#ddd] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#4f9d5d]";
const WEIGHT_INPUT = `${INPUT} min-w-0 flex-1`;
const WEIGHT_SELECT = `${INPUT} w-[84px] flex-none`;
const HINT = "text-[11px] text-[#999]";
const FIELD_ERROR = "text-[11px] text-[#d9534f]";

const IMAGE_ROW = "flex gap-10";
const IMAGE_LABEL = "mb-2 block text-[13px] font-semibold";
const IMAGE_LABEL_NOTE = "text-[11px] font-normal text-[#888]";
const COVER_UPLOAD =
  "flex h-[210px] w-[210px] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-[10px] border border-dashed border-[#ccc] text-[12px] text-[#888]";
const ADDITIONAL_ROW = "flex gap-3";
const ADDITIONAL_UPLOAD =
  "flex h-[105px] w-[105px] cursor-pointer items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-[#ccc] text-[#999]";
const PREVIEW_IMG = "h-full w-full object-cover";
const IMAGE_ERROR = `mt-2.5 block ${FIELD_ERROR}`;

const SUBMIT_ROW = "fixed right-8 bottom-6 z-[12] max-[640px]:right-[18px] max-[640px]:bottom-[18px]";
const SUBMIT_BTN =
  "cursor-pointer rounded-lg border-0 bg-[#2f7a3c] px-9 py-3.5 text-[16px] font-semibold text-white shadow-[0_8px_20px_rgba(25,82,37,0.22)] hover:bg-[#256330] disabled:cursor-not-allowed disabled:opacity-60";

const initialState = {
  productName: "",
  category: "",
  subCategory: "",
  material: "",
  weight: "",
  weightUnit: "kg",
  description: "",
  benefits: "",
  highlights: "",
  length: "",
  width: "",
  height: "",
  mrp: "",
  discountPrice: "",
  sellingPrice: "",
  sku: "",
  stockQuantity: "",
  lowStockAlert: "",
  howToUse: "",
  careInstruction: "",
};

export default function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(initialState);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([null, null, null, null]);
  const [additionalPreviews, setAdditionalPreviews] = useState([null, null, null, null]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!id) return;
    getProductById(id).then(({ data: product }) => {
      setForm({
        productName: product.productName ?? "", category: product.category ?? "", subCategory: product.subCategory ?? "",
        material: product.material ?? "", ...weightFields(product.weight), description: product.description ?? "",
        benefits: product.benefits ?? "", highlights: product.highlights ?? "", length: product.dimensions?.length ?? "",
        width: product.dimensions?.width ?? "", height: product.dimensions?.height ?? "", mrp: product.pricing?.mrp ?? "",
        discountPrice: product.pricing?.discountPrice ?? "", sellingPrice: product.pricing?.sellingPrice ?? "", sku: product.inventory?.sku ?? "",
        stockQuantity: product.inventory?.stockQuantity ?? "", lowStockAlert: product.inventory?.lowStockAlert ?? "",
        howToUse: product.usage?.howToUse ?? "", careInstruction: product.usage?.careInstruction ?? "",
      });
      setCoverPreview(product.images?.cover ?? null);
      setAdditionalPreviews([...(product.images?.additional ?? []), null, null, null, null].slice(0, 4));
    }).catch((err) => setServerError(err?.response?.data?.message || "Unable to load product"));
  }, [id]);

  useEffect(() => {
    getProductCategories()
      .then(({ data }) => setCategories(data))
      .catch((err) => setServerError(err?.response?.data?.message || "Unable to load categories"));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const handleAdditionalChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAdditionalImages((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
    setAdditionalPreviews((prev) => {
      const next = [...prev];
      next[index] = URL.createObjectURL(file);
      return next;
    });
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const validate = () => {
    const required = ["productName", "category", "subCategory", "material", "weight", "mrp", "sellingPrice", "stockQuantity", "lowStockAlert"];
    const newErrors = {};
    required.forEach((field) => {
      if (!String(form[field] ?? "").trim()) newErrors[field] = "Required";
    });
    ["weight", "mrp", "sellingPrice"].forEach((field) => {
      const value = Number(form[field]);
      if (form[field] !== "" && (!Number.isFinite(value) || value <= 0)) newErrors[field] = "Must be greater than 0";
    });
    if (form.discountPrice !== "" && (!Number.isFinite(Number(form.discountPrice)) || Number(form.discountPrice) <= 0)) {
      newErrors.discountPrice = "Must be greater than 0";
    }
    if (form.mrp !== "" && form.sellingPrice !== "" && Number(form.sellingPrice) > Number(form.mrp)) {
      newErrors.sellingPrice = "Cannot be greater than MRP";
    }
    ["stockQuantity", "lowStockAlert"].forEach((field) => {
      if (form[field] !== "" && (!Number.isInteger(Number(form[field])) || Number(form[field]) < 0)) {
        newErrors[field] = "Enter a whole number of 0 or more";
      }
    });
    ["length", "width", "height"].forEach((field) => {
      if (form[field] !== "" && (!Number.isFinite(Number(form[field])) || Number(form[field]) <= 0)) newErrors[field] = "Must be greater than 0";
    });
    if ([coverPreview, ...additionalPreviews].filter(Boolean).length < 3) {
      newErrors.images = "Upload at least 3 images, including a cover image";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "weightUnit") formData.append(key, key === "weight" ? `${value} ${form.weightUnit}`.trim() : value);
    });
    if (coverImage) formData.append("coverImage", coverImage);
    additionalImages.forEach((file) => {
      if (file) formData.append("additionalImages", file);
    });

    try {
      setSubmitting(true);
      if (isEditing) await updateProduct(id, formData);
      else await createProduct(formData);
      navigate("/products");
    } catch (err) {
      setServerError(err?.response?.data?.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={PAGE}>
      <button className={BACK_LINK} onClick={() => navigate(-1)} type="button">
        <ArrowLeft size={18} /> {isEditing ? "Edit Product" : "Add Product"}
      </button>

      <form className={FORM} onSubmit={handleSubmit}>
        {serverError && <div className={`${FORM_ERROR_BANNER} mb-4`}>{serverError}</div>}

        <section className={CARD}>
          <h3 className={CARD_TITLE}>Basic Information</h3>
          <div className={GRID_3}>
            <Field label="Product Name" required error={errors.productName}>
              <input className={INPUT} name="productName" value={form.productName} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
            <Field label="Category" required error={errors.category}>
              <select className={INPUT} name="category" value={form.category} onChange={handleChange}>
                <option value="">Select a category</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </Field>
            <Field label="Sub Category" required error={errors.subCategory}>
              <input className={INPUT} name="subCategory" value={form.subCategory} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
          </div>

          <div className={GRID_2}>
            <Field label="Material" required error={errors.material}>
              <input className={INPUT} name="material" value={form.material} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
            <Field label="Quantity" required error={errors.weight}>
              <div className="flex gap-2">
                <input className={WEIGHT_INPUT} name="weight" type="number" min="0" step="any" value={form.weight} onChange={handleChange} placeholder="Enter quantity" />
                <select className={WEIGHT_SELECT} name="weightUnit" value={form.weightUnit} onChange={handleChange} aria-label="Weight unit">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="l">l</option>
                  <option value="ml">ml</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                  <option value="pcs">pcs</option>
                </select>
              </div>
            </Field>
          </div>

          <Field label="Product Description">
            <textarea
              className={INPUT}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter Product Discription"
              rows={3}
            />
          </Field>

          <Field label="Product Benefits">
            <textarea
              className={INPUT}
              name="benefits"
              value={form.benefits}
              onChange={handleChange}
              placeholder="Enter the Benefits"
              rows={2}
            />
          </Field>

          <Field label="Product Highlights">
            <textarea
              className={INPUT}
              name="highlights"
              value={form.highlights}
              onChange={handleChange}
              placeholder="House no, Building,street,area"
              rows={3}
            />
          </Field>

          <h4 className={SUB_HEADING}>Dimensions (Optional)</h4>
          <div className={GRID_3}>
            <Field label="Length">
              <input className={INPUT} name="length" value={form.length} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
            <Field label="Width">
              <input className={INPUT} name="width" value={form.width} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
            <Field label="Height">
              <input className={INPUT} name="height" value={form.height} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
          </div>
        </section>

        <section className={CARD}>
          <h3 className={CARD_TITLE}>Pricing</h3>
          <div className={GRID_3}>
            <Field label="MRP" required error={errors.mrp}>
              <input className={INPUT} name="mrp" type="number" min="0.01" step="0.01" value={form.mrp} onChange={handleChange} placeholder="₹ Enter the Price" />
            </Field>
            <Field label="Discount / Offer Price" error={errors.discountPrice}>
              <input className={INPUT} name="discountPrice" type="number" min="0.01" step="0.01" value={form.discountPrice} onChange={handleChange} placeholder="₹ Enter the Price" />
            </Field>
            <Field label="Selling Price" required error={errors.sellingPrice}>
              <input className={INPUT} name="sellingPrice" type="number" min="0.01" step="0.01" value={form.sellingPrice} onChange={handleChange} placeholder="₹ Enter the Price" />
            </Field>
          </div>
        </section>

        <section className={CARD}>
          <h3 className={CARD_TITLE}>Product Image</h3>
          <div className={IMAGE_ROW}>
            <div>
              <span className={IMAGE_LABEL}>Cover Image</span>
              <label className={COVER_UPLOAD}>
                {coverPreview ? (
                  <img className={PREVIEW_IMG} src={coverPreview} alt="cover preview" />
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Upload Cover Image</span>
                    <span>PNG,JPG</span>
                    <span>(Max 2MB)</span>
                  </>
                )}
                <input type="file" accept="image/png,image/jpeg" hidden onChange={handleCoverChange} />
              </label>
            </div>

            <div>
              <span className={IMAGE_LABEL}>Additional Image <small className={IMAGE_LABEL_NOTE}>(minimum 3 total images)</small></span>
              <div className={ADDITIONAL_ROW}>
                {additionalPreviews.map((preview, idx) => (
                  <label className={ADDITIONAL_UPLOAD} key={idx}>
                    {preview ? (
                      <img className={PREVIEW_IMG} src={preview} alt={`additional ${idx + 1}`} />
                    ) : (
                      <Plus size={22} />
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      hidden
                      onChange={(e) => handleAdditionalChange(idx, e)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
          {errors.images && <span className={IMAGE_ERROR}>{errors.images}</span>}
        </section>

        <section className={CARD}>
          <h3 className={CARD_TITLE}>Inventory</h3>
          <div className={GRID_3}>
            <Field label="SKU">
              <input className={INPUT} name="sku" value={form.sku} onChange={handleChange} placeholder="Optional SKU" />
              <span className={HINT}>Stock Keeping Unit</span>
            </Field>
            <Field label="Stock Quantity" required error={errors.stockQuantity}>
              <input className={INPUT} name="stockQuantity" type="number" min="0" step="1" value={form.stockQuantity} onChange={handleChange} placeholder="Enter quantity" />
            </Field>
            <Field label="Low Stock Alert" required error={errors.lowStockAlert}>
              <input className={INPUT} name="lowStockAlert" type="number" min="0" step="1" value={form.lowStockAlert} onChange={handleChange} placeholder="Enter quantity" />
              <span className={HINT}>You will be notified when stock reaches this level</span>
            </Field>
          </div>
        </section>

        <section className={CARD}>
          <h3 className={CARD_TITLE}>Usage &amp; Care</h3>
          <div className={GRID_2}>
            <Field label="How To Use">
              <input className={INPUT} name="howToUse" value={form.howToUse} onChange={handleChange} placeholder="Explain How to use your product" />
            </Field>
            <Field label="Care Instruction">
              <input className={INPUT} name="careInstruction" value={form.careInstruction} onChange={handleChange} placeholder="Provide care and maintenance instructions" />
            </Field>
          </div>
        </section>

        <div className={SUBMIT_ROW}>
          <button type="submit" className={SUBMIT_BTN} disabled={submitting}>
            {submitting ? "Saving..." : isEditing ? "Update Product" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className={FIELD}>
      <label className={FIELD_LABEL}>
        {label} {required && <span className={REQUIRED}>*</span>}
      </label>
      {children}
      {error && <span className={FIELD_ERROR}>{error}</span>}
    </div>
  );
}

function weightFields(weight = "") {
  const match = String(weight).trim().match(/^(.+?)\s*(kg|g|l|ml|lb|oz|pcs)$/i);
  return {
    weight: match ? match[1].trim() : weight,
    weightUnit: match ? match[2].toLowerCase() : "kg",
  };
}