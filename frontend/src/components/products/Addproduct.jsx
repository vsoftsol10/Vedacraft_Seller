import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { createProduct, getProductById, getProductCategories, updateProduct } from "../../api/productapi";
import "../../styles/addproduct.css";

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
    <div className="add-product-page">
      <button className="back-link" onClick={() => navigate(-1)} type="button">
        <ArrowLeft size={18} /> {isEditing ? "Edit Product" : "Add Product"}
      </button>

      <form onSubmit={handleSubmit}>
        {serverError && <div className="form-error-banner">{serverError}</div>}

        <section className="form-card">
          <h3>Basic Information</h3>
          <div className="grid-3">
            <Field label="Product Name" required error={errors.productName}>
              <input name="productName" value={form.productName} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
            <Field label="Category" required error={errors.category}>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="">Select a category</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </Field>
            <Field label="Sub Category" required error={errors.subCategory}>
              <input name="subCategory" value={form.subCategory} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
          </div>

          <div className="grid-2">
            <Field label="Material" required error={errors.material}>
              <input name="material" value={form.material} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
            <Field label="Quantity" required error={errors.weight}>
              <div className="weight-input-group">
                <input name="weight" type="number" min="0" step="any" value={form.weight} onChange={handleChange} placeholder="Enter quantity" />
                <select name="weightUnit" value={form.weightUnit} onChange={handleChange} aria-label="Weight unit">
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
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter Product Discription"
              rows={3}
            />
          </Field>

          <Field label="Product Benefits">
            <textarea
              name="benefits"
              value={form.benefits}
              onChange={handleChange}
              placeholder="Enter the Benefits"
              rows={2}
            />
          </Field>

          <Field label="Product Highlights">
            <textarea
              name="highlights"
              value={form.highlights}
              onChange={handleChange}
              placeholder="House no, Building,street,area"
              rows={3}
            />
          </Field>

          <h4 className="sub-heading">Dimensions (Optional)</h4>
          <div className="grid-3">
            <Field label="Length">
              <input name="length" value={form.length} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
            <Field label="Width">
              <input name="width" value={form.width} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
            <Field label="Height">
              <input name="height" value={form.height} onChange={handleChange} placeholder="Enter Full Name" />
            </Field>
          </div>
        </section>

        <section className="form-card">
          <h3>Pricing</h3>
          <div className="grid-3">
            <Field label="MRP" required error={errors.mrp}>
              <input name="mrp" type="number" min="0.01" step="0.01" value={form.mrp} onChange={handleChange} placeholder="₹ Enter the Price" />
            </Field>
            <Field label="Discount / Offer Price" error={errors.discountPrice}>
              <input name="discountPrice" type="number" min="0.01" step="0.01" value={form.discountPrice} onChange={handleChange} placeholder="₹ Enter the Price" />
            </Field>
            <Field label="Selling Price" required error={errors.sellingPrice}>
              <input name="sellingPrice" type="number" min="0.01" step="0.01" value={form.sellingPrice} onChange={handleChange} placeholder="₹ Enter the Price" />
            </Field>
          </div>
        </section>

        <section className="form-card">
          <h3>Product Image</h3>
          <div className="image-row">
            <div>
              <span className="field-label">Cover Image</span>
              <label className="cover-upload">
                {coverPreview ? (
                  <img src={coverPreview} alt="cover preview" />
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Upload Cover Image</span>
                    <span className="hint">PNG,JPG</span>
                    <span className="hint">(Max 2MB)</span>
                  </>
                )}
                <input type="file" accept="image/png,image/jpeg" hidden onChange={handleCoverChange} />
              </label>
            </div>

            <div>
              <span className="field-label">Additional Image <small>(minimum 3 total images)</small></span>
              <div className="additional-row">
                {additionalPreviews.map((preview, idx) => (
                  <label className="additional-upload" key={idx}>
                    {preview ? (
                      <img src={preview} alt={`additional ${idx + 1}`} />
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
          {errors.images && <span className="field-error image-error">{errors.images}</span>}
        </section>

        <section className="form-card">
          <h3>Inventory</h3>
          <div className="grid-3">
            <Field label="SKU">
              <input name="sku" value={form.sku} onChange={handleChange} placeholder="Optional SKU" />
              <span className="hint">Stock Keeping Unit</span>
            </Field>
            <Field label="Stock Quantity" required error={errors.stockQuantity}>
              <input name="stockQuantity" type="number" min="0" step="1" value={form.stockQuantity} onChange={handleChange} placeholder="Enter quantity" />
            </Field>
            <Field label="Low Stock Alert" required error={errors.lowStockAlert}>
              <input name="lowStockAlert" type="number" min="0" step="1" value={form.lowStockAlert} onChange={handleChange} placeholder="Enter quantity" />
              <span className="hint">You will be notified when stock reaches this level</span>
            </Field>
          </div>
        </section>

        <section className="form-card">
          <h3>Usage &amp; Care</h3>
          <div className="grid-2">
            <Field label="How To Use">
              <input name="howToUse" value={form.howToUse} onChange={handleChange} placeholder="Explain How to use your product" />
            </Field>
            <Field label="Care Instruction">
              <input name="careInstruction" value={form.careInstruction} onChange={handleChange} placeholder="Provide care and maintenance instructions" />
            </Field>
          </div>
        </section>

        <div className="submit-row">
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? "Saving..." : isEditing ? "Update Product" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className="field">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      {children}
      {error && <span className="field-error">{error}</span>}
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
