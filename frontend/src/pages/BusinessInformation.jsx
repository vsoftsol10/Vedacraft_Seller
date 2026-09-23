import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { fetchBusiness, parseBusinessApiError, saveBusiness } from "../api/businessapi";

const EMPTY = {
  businessName: "",
  storeName: "",
  storeType: "",
  subCategory: "",
  gstNumber: "",
  panNumber: "",
  businessType: "Individual",
  storeDescription: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",
  address1: "",
};

const BUSINESS_TYPES = ["Individual", "Registered Business"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const SAVED_FIELDS = ["businessName", "storeName", "storeType", "storeDescription", "gstNumber", "panNumber"];

const inputBase =
  "rounded-md border bg-white px-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/25 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

function validate(values) {
  const errors = {};
  const storeName = clean(values.storeName);
  const storeType = clean(values.storeType);
  const businessName = clean(values.businessName);

  if (businessName && (businessName.length < 2 || businessName.length > 150)) errors.businessName = "Business name must be 2-150 characters.";
  if (storeName && (storeName.length < 2 || storeName.length > 100)) errors.storeName = "Store name must be 2-100 characters.";
  if (storeType && (storeType.length < 2 || storeType.length > 100)) errors.storeType = "Business category must be 2-100 characters when provided.";
  if (String(values.storeDescription ?? "").length > 1000) errors.storeDescription = "Description can be up to 1000 characters.";
  return errors;
}

const toFormValues = (data) => ({
  ...EMPTY,
  businessName: data?.businessName ?? "",
  storeName: data?.storeName ?? "",
  storeType: data?.storeType ?? "",
  storeDescription: data?.storeDescription ?? "",
  panNumber: data?.panNumber ?? "",
  gstNumber: data?.gstNumber ?? "",
});

export default function BusinessInformation() {
  const [saved, setSaved] = useState(EMPTY);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverError, setCoverError] = useState("");
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);
  const fileInputRef = useRef(null);

  const applyBusiness = useCallback((data) => {
    const next = toFormValues(data);
    setSaved(next);
    setValues(next);
    setErrors({});
    setTouched({});
    setLoadFailed(false);
  }, []);

  const loadBusiness = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    setBanner(null);
    try {
      applyBusiness(await fetchBusiness());
    } catch (err) {
      setLoadFailed(true);
      setBanner({ type: "error", text: parseBusinessApiError(err).message });
    } finally {
      setLoading(false);
    }
  }, [applyBusiness]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBusiness();
        if (!cancelled) applyBusiness(data);
      } catch (err) {
        if (!cancelled) {
          setLoadFailed(true);
          setBanner({ type: "error", text: parseBusinessApiError(err).message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applyBusiness]);

  const dirty = SAVED_FIELDS.some((field) => values[field] !== saved[field]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    setBanner(null);
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validate({ ...values, [name]: value })[name] }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(values)[name] }));
  };

  const handlePickImage = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    if (!ALLOWED_IMAGE_TYPES.includes(picked.type)) return setCoverError("Only PNG or JPG images are allowed.");
    if (picked.size > MAX_IMAGE_BYTES) return setCoverError("Image must be 2 MB or smaller.");
    setCoverError("");
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result);
    reader.readAsDataURL(picked);
  };

  const handleCancel = () => {
    setValues(saved);
    setErrors({});
    setTouched({});
    setCoverPreview(null);
    setCoverError("");
    setBanner(null);
  };

  const handleSave = async () => {
    if (saving || !dirty) return;
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setTouched({ businessName: true, storeName: true, storeType: true, storeDescription: true });
      return;
    }

    setSaving(true);
    setBanner(null);
    try {
      const data = await saveBusiness(values);
      applyBusiness(data);
      setBanner({ type: "success", text: "Business information saved." });
    } catch (err) {
      const { message, fieldErrors } = parseBusinessApiError(err);
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setBanner({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const renderField = ({ label, name, required, optional, disabled, hint, placeholder, as = "input", rows = 4, maxLength }) => {
    const Control = as;
    const error = errors[name];
    const sizeClass = as === "textarea" ? "min-h-[100px] resize-y py-2.5" : "h-[50px]";
    return (
      <div className="flex flex-col gap-1.5 px-1" key={name}>
        <label htmlFor={name} className="text-base text-gray-900">
          {label}
          {required && <span className="text-red-600"> *</span>}
          {optional && <span className="text-gray-700"> (optional)</span>}
        </label>
        <Control
          id={name}
          name={name}
          value={values[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={as === "textarea" ? rows : undefined}
          type={as === "input" ? "text" : undefined}
          aria-invalid={Boolean(error)}
          className={`${inputBase} ${sizeClass} ${error ? "border-red-600" : "border-gray-300"}`}
        />
        {hint && !error && <p className="m-0 text-xs text-gray-500">{hint}</p>}
        {error && <p className="m-0 text-xs text-red-600">{error}</p>}
      </div>
    );
  };

  if (loading) {
    return <div className="flex max-w-[1100px] flex-col gap-5 pb-8 pt-2"><header><h1 className="m-0 text-[32px] font-bold text-gray-900">Business Information</h1><p className="mb-0 mt-1.5 text-[15px] text-gray-800">Manage your personal and store profile information.</p></header><p className="m-0 text-sm text-gray-500">Loading business information…</p></div>;
  }

  if (loadFailed) {
    return <div className="flex max-w-[1100px] flex-col gap-5 pb-8 pt-2"><header><h1 className="m-0 text-[32px] font-bold text-gray-900">Business Information</h1><p className="mb-0 mt-1.5 text-[15px] text-gray-800">Manage your personal and store profile information.</p></header><p className="m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{banner?.text || "Unable to load business information."}</p><button type="button" onClick={loadBusiness} className="w-fit rounded border border-gray-900 bg-white px-4 py-2 text-sm font-semibold text-gray-900">Retry</button></div>;
  }

  return (
    <div className="flex max-w-[1100px] flex-col gap-5 pb-8 pt-2">
      <header>
        <h1 className="m-0 text-[32px] font-bold text-gray-900">Business Information</h1>
        <p className="mb-0 mt-1.5 text-[15px] text-gray-800">Manage your personal and store profile information.</p>
      </header>

      <section className="flex flex-col gap-4 rounded-[14px] border border-gray-200 bg-white px-3 pb-5 pt-4">
        <h2 className="m-0 ml-1 text-[15px] font-bold text-gray-900">Store Details</h2>

        <div className="grid grid-cols-1 gap-x-3 gap-y-4 md:grid-cols-3">
          {renderField({ label: "Business Name", name: "businessName", placeholder: "Enter business name", maxLength: 150 })}
          {renderField({ label: "Store Name", name: "storeName", placeholder: "Enter store name", maxLength: 100 })}
          {renderField({ label: "Business Category", name: "storeType", required: true, placeholder: "Enter business category", maxLength: 100 })}
          {renderField({ label: "Sub Category", name: "subCategory", optional: true, placeholder: "Enter sub category" })}
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-4 md:grid-cols-2">
          {renderField({ label: "GST Number", name: "gstNumber", optional: true, disabled: true, placeholder: "Not provided", hint: "Verified at approval. Contact support to change." })}
          {renderField({ label: "PAN Number", name: "panNumber", required: true, disabled: true, placeholder: "Not provided", hint: "Verified at approval. Contact support to change." })}
        </div>

        <fieldset className="m-0 border-0 px-3.5">
          <legend className="p-0 text-[15px] font-bold text-gray-900">Business Type</legend>
          <div className="mt-2.5 flex gap-6">
            {BUSINESS_TYPES.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-1.5 text-[15px]">
                <input
                  type="radio"
                  name="businessType"
                  value={type}
                  checked={values.businessType === type}
                  onChange={handleChange}
                  className="accent-green-700"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {renderField({
          label: "Store Description",
          name: "storeDescription",
          as: "textarea",
          placeholder: "Describe your store and what you sell",
          maxLength: 1000,
          rows: 4,
          hint: `${values.storeDescription.length}/1000`,
        })}
      </section>

      <section className="flex flex-col gap-4 rounded-[14px] border border-gray-200 bg-white px-3 pb-5 pt-4">
        <h2 className="m-0 ml-1 text-[15px] font-bold text-gray-900">Business Address</h2>

        <div className="grid grid-cols-1 gap-x-3 gap-y-4 md:grid-cols-2">
          {renderField({ label: "City", name: "city", required: true, placeholder: "Enter city" })}
          {renderField({ label: "State", name: "state", required: true, placeholder: "Enter state" })}
          {renderField({ label: "Pin code", name: "pinCode", required: true, placeholder: "6-digit pin code", maxLength: 6 })}
          {renderField({ label: "Country", name: "country", required: true, placeholder: "Enter country" })}
        </div>

        {renderField({ label: "Address 1", name: "address1", as: "textarea", required: true, placeholder: "House no, Building, street, area", rows: 4 })}
      </section>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-[136px] w-40 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[10px] border border-gray-300 bg-white p-0 text-xs text-gray-400 hover:border-amber-400"
        >
          {coverPreview ? (
            <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <>
              <Upload size={26} />
              <span>Upload Cover Image</span>
              <span>PNG, JPG</span>
              <span>(Max 2MB)</span>
            </>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" hidden onChange={handlePickImage} />
        {coverError && <p className="m-0 text-xs text-red-600">{coverError}</p>}
      </div>

      {banner && <p className={`m-0 rounded-md px-3 py-2 text-sm ${banner.type === "success" ? "border border-green-200 bg-green-50 text-green-800" : "border border-red-200 bg-red-50 text-red-700"}`} role={banner.type === "error" ? "alert" : "status"}>{banner.text}</p>}

      <div className="flex flex-col-reverse gap-5 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={!dirty || saving}
          className="h-12 w-full cursor-pointer rounded border border-gray-900 bg-white text-lg font-semibold text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 md:h-[54px] md:w-[220px] md:text-[22px]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="h-12 w-full cursor-pointer rounded border border-green-700 bg-green-700 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 md:h-[54px] md:w-[220px] md:text-[22px]"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
