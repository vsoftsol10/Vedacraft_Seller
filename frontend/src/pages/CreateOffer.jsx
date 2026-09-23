import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getProducts } from "../api/productapi";
import { createOffer } from "../api/offerapi";

const inputBase = "h-[46px] rounded-md border bg-white px-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/25";
const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
const errorMessage = (error) => error?.response?.data?.message || "Unable to create the offer. Please try again.";

function validate(values) {
  const errors = {};
  if (!clean(values.offerName)) errors.offerName = "Offer name is required.";
  else if (clean(values.offerName).length > 100) errors.offerName = "Offer name must be 100 characters or fewer.";
  if (values.description.length > 300) errors.description = "Description can be up to 300 characters.";
  const value = Number(values.discountValue);
  if (!values.discountValue.trim() || !Number.isFinite(value) || value <= 0) errors.discountValue = "Enter a discount value greater than 0.";
  else if (values.discountType === "percentage" && value > 100) errors.discountValue = "Percentage discount cannot exceed 100.";
  if (values.startDate && values.endDate && new Date(values.endDate) <= new Date(values.startDate)) errors.endDate = "End date must be after start date.";
  if (values.scope === "select_products" && values.productIds.length === 0) errors.productIds = "Select at least one product.";
  return errors;
}

export default function CreateOffer() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ offerName: "", description: "", discountType: "percentage", discountValue: "", scope: "all_products", productIds: [], startDate: "", endDate: "" });
  const [products, setProducts] = useState([]);
  const [productsError, setProductsError] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    let active = true;
    getProducts({ page: 1, limit: 100 }).then((response) => { if (active) setProducts(response.data ?? []); }).catch(() => { if (active) setProductsError("Unable to load products. Try again before selecting products."); });
    return () => { active = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setServerError("");
  };
  const toggleProduct = (productId) => {
    setValues((previous) => ({ ...previous, productIds: previous.productIds.includes(productId) ? previous.productIds.filter((id) => id !== productId) : [...previous.productIds, productId] }));
    setErrors((previous) => ({ ...previous, productIds: undefined }));
  };
  const handleSubmit = async () => {
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setServerError("");
    try {
      await createOffer({ ...values, offerName: clean(values.offerName), description: clean(values.description) || null, discountValue: Number(values.discountValue), startDate: values.startDate || null, endDate: values.endDate || null });
      navigate("/settings/offers");
    } catch (error) { setServerError(errorMessage(error)); }
    finally { setSaving(false); }
  };

  return <div className="flex max-w-[1100px] flex-col gap-5 pb-8 pt-2">
    <button type="button" onClick={() => navigate("/settings/offers")} className="flex w-fit cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-lg font-semibold text-gray-900"><ArrowLeft size={18} /> Create Offer</button>
    <section className="flex flex-col gap-4 rounded-[14px] border border-gray-200 bg-white px-3 pb-5 pt-4"><h2 className="m-0 text-[15px] font-bold text-gray-900">Offer Details</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="flex flex-col gap-1.5"><label htmlFor="offerName" className="text-base text-gray-900">Offer Name<span className="text-red-600"> *</span></label><input id="offerName" name="offerName" value={values.offerName} onChange={handleChange} maxLength={100} className={`${inputBase} ${errors.offerName ? "border-red-600" : "border-gray-300"}`} />{errors.offerName && <p className="m-0 text-xs text-red-600">{errors.offerName}</p>}</div><div className="flex flex-col gap-1.5"><label htmlFor="description" className="text-base text-gray-900">Offer Description</label><textarea id="description" name="description" value={values.description} onChange={handleChange} maxLength={300} rows={3} className="resize-y rounded-md border border-gray-300 px-2.5 py-2.5 text-sm" /><p className="m-0 text-right text-xs text-gray-500">{values.description.length}/300</p>{errors.description && <p className="m-0 text-xs text-red-600">{errors.description}</p>}</div></div></section>
    <section className="flex flex-col gap-4 rounded-[14px] border border-gray-200 bg-white px-3 pb-5 pt-4"><h2 className="m-0 text-[15px] font-bold text-gray-900">Discount Details</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="flex flex-col gap-1.5"><label htmlFor="discountType">Discount Type</label><select id="discountType" name="discountType" value={values.discountType} onChange={handleChange} className={`${inputBase} border-gray-300`}><option value="percentage">Percentage</option><option value="fixed">Flat Amount</option></select></div><div className="flex flex-col gap-1.5"><label htmlFor="discountValue">Discount Value</label><input id="discountValue" name="discountValue" value={values.discountValue} onChange={handleChange} inputMode="decimal" className={`${inputBase} ${errors.discountValue ? "border-red-600" : "border-gray-300"}`} />{errors.discountValue && <p className="m-0 text-xs text-red-600">{errors.discountValue}</p>}</div></div></section>
    <section className="flex flex-col gap-4 rounded-[14px] border border-gray-200 bg-white px-3 pb-5 pt-4"><h2 className="m-0 text-[15px] font-bold text-gray-900">Offer Period</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="flex flex-col gap-1.5"><label htmlFor="startDate">Start date</label><input id="startDate" name="startDate" type="datetime-local" value={values.startDate} onChange={handleChange} className={`${inputBase} border-gray-300`} /></div><div className="flex flex-col gap-1.5"><label htmlFor="endDate">End date <span className="text-gray-500">(optional)</span></label><input id="endDate" name="endDate" type="datetime-local" value={values.endDate} onChange={handleChange} className={`${inputBase} ${errors.endDate ? "border-red-600" : "border-gray-300"}`} />{errors.endDate && <p className="m-0 text-xs text-red-600">{errors.endDate}</p>}</div></div></section>
    <section className="flex flex-col gap-3 rounded-[14px] border border-gray-200 bg-white px-3 pb-5 pt-4"><h2 className="m-0 text-[15px] font-bold text-gray-900">Applicable On</h2><div className="flex gap-6"><label className="flex cursor-pointer items-center gap-1.5"><input type="radio" name="scope" value="all_products" checked={values.scope === "all_products"} onChange={handleChange} className="accent-green-700" />All Products</label><label className="flex cursor-pointer items-center gap-1.5"><input type="radio" name="scope" value="select_products" checked={values.scope === "select_products"} onChange={handleChange} className="accent-green-700" />Select Products</label></div>{values.scope === "select_products" && <div className="max-h-52 overflow-y-auto rounded border border-gray-200 p-2">{productsError ? <p className="m-1 text-sm text-red-600">{productsError}</p> : products.length === 0 ? <p className="m-1 text-sm text-gray-500">No products available.</p> : products.map((product) => <label key={product.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"><input type="checkbox" checked={values.productIds.includes(product.id)} onChange={() => toggleProduct(product.id)} className="accent-green-700" /><span className="text-sm text-gray-900">{product.productName}</span><span className="text-xs text-gray-500">{product.productId}</span></label>)}</div>}{errors.productIds && <p className="m-0 text-xs text-red-600">{errors.productIds}</p>}</section>
    {serverError && <p className="m-0 text-sm text-red-600">{serverError}</p>}<div className="flex flex-col-reverse gap-4 md:flex-row md:justify-end"><button type="button" onClick={() => navigate("/settings/offers")} disabled={saving} className="h-12 w-full cursor-pointer rounded border border-gray-900 bg-white text-base font-semibold text-gray-900 md:w-[180px]">Cancel</button><button type="button" onClick={handleSubmit} disabled={saving} className="h-12 w-full cursor-pointer rounded border border-green-700 bg-green-700 text-base font-semibold text-white disabled:opacity-60 md:w-[180px]">{saving ? "Creating..." : "Create Offer"}</button></div>
  </div>;
}
