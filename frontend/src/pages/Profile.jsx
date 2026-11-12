import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, LoaderCircle, CheckCircle, Eye, EyeOff, Lock, KeyRound } from "lucide-react";
import { fetchProfile, parseApiError, saveProfile, saveSellingStatus } from "../api/profileapi";
import { changePassword } from "../api/authapi";

const EMPTY = {
  fullName: "",
  email: "",
  mobileNumber: "",
  alternateNumber: "",
  isSellingActive: true,
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const MAX_SIZE_MB = 2;

function validate(form) {
  const errors = {};
  if (!form.fullName || form.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters";
  }
  if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (!form.mobileNumber || !/^[6-9]\d{9}$/.test(form.mobileNumber)) {
    errors.mobileNumber = "Enter a valid 10-digit mobile number";
  }
  if (form.alternateNumber && !/^[6-9]\d{9}$/.test(form.alternateNumber)) {
    errors.alternateNumber = "Enter a valid 10-digit mobile number";
  } else if (form.alternateNumber && form.alternateNumber === form.mobileNumber) {
    errors.alternateNumber = "Must be different from your mobile number";
  }
  return errors;
}

export default function Profile() {
  const [saved, setSaved] = useState(EMPTY);
  const [savedImage, setSavedImage] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [newImage, setNewImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);

  // Inactive Modal State
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("Product Arrived damaged");
  const [additionalNote, setAdditionalNote] = useState("");
  const [inactiveSubmitting, setInactiveSubmitting] = useState(false);

  // Change Password State
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [showPwdCurrent, setShowPwdCurrent] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!pwdCurrent) {
      return setPwdError("Please enter your current password.");
    }
    if (!pwdNew || pwdNew.length < 8) {
      return setPwdError("New password must be at least 8 characters long.");
    }
    if (pwdNew === pwdCurrent) {
      return setPwdError("New password must be different from your current password.");
    }
    if (pwdNew !== pwdConfirm) {
      return setPwdError("New passwords do not match.");
    }

    try {
      setPwdSubmitting(true);
      const res = await changePassword({ currentPassword: pwdCurrent, newPassword: pwdNew });
      setPwdSuccess(res.message || "Password updated successfully.");
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
    } catch (err) {
      setPwdError(err.response?.data?.message || "Failed to update password. Please check your current password.");
    } finally {
      setPwdSubmitting(false);
    }
  };

  const fileInputRef = useRef(null);

  const applyData = useCallback((data) => {
    const formatted = {
      fullName: data?.fullName ?? "",
      email: data?.email ?? "",
      mobileNumber: data?.mobileNumber ?? "",
      alternateNumber: data?.alternateNumber ?? "",
      isSellingActive: data?.isSellingActive !== false,
    };
    setSaved(formatted);
    setForm(formatted);
    setSavedImage(data?.profileImage ?? null);
    setNewImage(null);
    setPreviewUrl(null);
    setRemoveImage(false);
    setErrors({});
    setImageError("");
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (!cancelled) applyData(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setBanner({ type: "error", text: parseApiError(e).message });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyData]);

  // Clean up object URL when unmounting or changing preview
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalVal = name.includes("Number")
      ? value.replace(/\D/g, "").slice(0, 10)
      : value;
    setForm((prev) => ({ ...prev, [name]: finalVal }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleToggleSelling = () => {
    if (form.isSellingActive) {
      setShowInactiveModal(true);
    } else {
      setForm((prev) => ({ ...prev, isSellingActive: true }));
      saveSellingStatus(true).catch(() => {});
    }
  };

  const handleConfirmInactive = async () => {
    setInactiveSubmitting(true);
    try {
      await saveSellingStatus(false);
      setForm((prev) => ({ ...prev, isSellingActive: false }));
      setSaved((prev) => ({ ...prev, isSellingActive: false }));
      setShowInactiveModal(false);
      setBanner({ type: "success", text: "Store status set to Inactive." });
    } catch {
      setForm((prev) => ({ ...prev, isSellingActive: false }));
      setShowInactiveModal(false);
    } finally {
      setInactiveSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError("Only PNG and JPG images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setImageError(`Image must be ${MAX_SIZE_MB}MB or smaller.`);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setNewImage(file);
    setRemoveImage(false);
    setImageError("");
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setNewImage(null);
    setRemoveImage(true);
    setImageError("");
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setForm(saved);
    setNewImage(null);
    setRemoveImage(false);
    setErrors({});
    setImageError("");
    setBanner(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    setBanner(null);

    try {
      const data = await saveProfile(form, {
        imageFile: newImage,
        removeImage,
      });

      // If selling status is also modified, ensure it is in sync
      if (form.isSellingActive !== saved.isSellingActive) {
        try {
          await saveSellingStatus(form.isSellingActive);
        } catch {
          // ignore or handled by main update
        }
      }

      applyData(data);
      window.dispatchEvent(new Event("seller-profile-updated"));
      setBanner({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setBanner({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const displayImage = previewUrl || (removeImage ? null : savedImage);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#2f7a3c]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1100px] py-4 text-[#111]">
      {/* Title & Description */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#111]">Profile</h1>
        <p className="mt-1 text-sm text-[#555]">
          Manage your personal and store profile information.
        </p>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`mb-6 flex items-center justify-between rounded-lg px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" && <CheckCircle size={18} className="text-green-600" />}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-base font-medium text-[#111]"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Aarav Sharma"
              className={`h-12 w-full rounded-lg border px-4 text-base text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2f7a3c] ${
                errors.fullName ? "border-red-500" : "border-gray-300 focus:border-[#2f7a3c]"
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-base font-medium text-[#111]"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Aarav Sharma"
              className={`h-12 w-full rounded-lg border px-4 text-base text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2f7a3c] ${
                errors.email ? "border-red-500" : "border-gray-300 focus:border-[#2f7a3c]"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label
              htmlFor="mobileNumber"
              className="mb-2 block text-base font-medium text-[#111]"
            >
              Mobile Number
            </label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              value={form.mobileNumber}
              onChange={handleChange}
              placeholder="Aarav Sharma"
              className={`h-12 w-full rounded-lg border px-4 text-base text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2f7a3c] ${
                errors.mobileNumber ? "border-red-500" : "border-gray-300 focus:border-[#2f7a3c]"
              }`}
            />
            {errors.mobileNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>
            )}
          </div>

          {/* Alternate Number (optional ) */}
          <div>
            <label
              htmlFor="alternateNumber"
              className="mb-2 block text-base font-medium text-[#111]"
            >
              Alternate Number <span className="font-normal text-gray-400">(optional )</span>
            </label>
            <input
              type="tel"
              id="alternateNumber"
              name="alternateNumber"
              value={form.alternateNumber}
              onChange={handleChange}
              placeholder="Aarav Sharma"
              className={`h-12 w-full rounded-lg border px-4 text-base text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2f7a3c] ${
                errors.alternateNumber ? "border-red-500" : "border-gray-300 focus:border-[#2f7a3c]"
              }`}
            />
            {errors.alternateNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.alternateNumber}</p>
            )}
          </div>
        </div>

        {/* Upload Cover Image Box */}
        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-32 w-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-white p-3 text-center transition hover:border-gray-400"
          >
            {displayImage ? (
              <>
                <img
                  src={displayImage}
                  alt="Profile"
                  className="h-full w-full rounded-lg object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-xs font-medium text-white">Change</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white hover:bg-red-700"
                    title="Remove photo"
                  >
                    <X size={14} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Upload size={24} className="mb-1 text-gray-400 stroke-[1.5]" />
                <span className="text-[11px] leading-tight text-gray-400">
                  Upload Cover Image
                </span>
                <span className="mt-1 text-[10px] leading-tight text-gray-400">
                  PNG ,JPG
                </span>
                <span className="text-[10px] leading-tight text-gray-400">
                  (Max 2MB)
                </span>
              </>
            )}
          </div>
          {imageError && (
            <p className="mt-1.5 text-xs text-red-600">{imageError}</p>
          )}
        </div>

        {/* Selling Status */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#111]">Selling Status</h2>
          <div className="mt-1 flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={handleToggleSelling}
                className="text-base font-semibold text-[#111] hover:underline cursor-pointer bg-transparent border-0 p-0 text-left"
              >
                {form.isSellingActive ? "Active" : "Inactive"}
              </button>
              <p className="mt-0.5 text-sm text-[#666]">
                {form.isSellingActive
                  ? "Your store is currently accepting new orders"
                  : "Your store is currently not accepting new orders"}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={form.isSellingActive}
              onClick={handleToggleSelling}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                form.isSellingActive ? "bg-[#55bd32]" : "bg-gray-300"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.isSellingActive ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Buttons (Cancel and Save) */}
        <div className="mt-12 flex justify-end gap-4 pb-8">
          <button
            type="button"
            onClick={handleCancel}
            className="h-11 min-w-[140px] rounded-lg border border-black bg-white px-6 text-base font-medium text-black transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-11 min-w-[140px] rounded-lg border-0 bg-[#257d2a] px-6 text-base font-medium text-white transition-colors hover:bg-[#1f6823] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {/* Change Password Section */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
          <p className="mt-1 text-sm text-gray-500">
            Keep your seller account secure by updating your password regularly.
          </p>
        </div>

        {pwdSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-800 border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <span>{pwdSuccess}</span>
          </div>
        )}

        {pwdError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800 border border-red-200">
            <span className="shrink-0 font-bold">!</span>
            <span>{pwdError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="mt-6 max-w-xl space-y-4" noValidate>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5" htmlFor="profile-current-password">
              Current Password
            </label>
            <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 focus-within:border-[#257d2a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#257d2a]/20">
              <KeyRound size={18} className="text-gray-400 mr-2 shrink-0" />
              <input
                id="profile-current-password"
                className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
                type={showPwdCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
                disabled={pwdSubmitting}
              />
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setShowPwdCurrent(!showPwdCurrent)}
                aria-label={showPwdCurrent ? "Hide password" : "Show password"}
              >
                {showPwdCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5" htmlFor="profile-new-password">
              New Password
            </label>
            <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 focus-within:border-[#257d2a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#257d2a]/20">
              <Lock size={18} className="text-gray-400 mr-2 shrink-0" />
              <input
                id="profile-new-password"
                className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
                type={showPwdNew ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                disabled={pwdSubmitting}
              />
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setShowPwdNew(!showPwdNew)}
                aria-label={showPwdNew ? "Hide password" : "Show password"}
              >
                {showPwdNew ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5" htmlFor="profile-confirm-password">
              Confirm New Password
            </label>
            <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 focus-within:border-[#257d2a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#257d2a]/20">
              <Lock size={18} className="text-gray-400 mr-2 shrink-0" />
              <input
                id="profile-confirm-password"
                className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
                type={showPwdConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                disabled={pwdSubmitting}
              />
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setShowPwdConfirm(!showPwdConfirm)}
                aria-label={showPwdConfirm ? "Hide password" : "Show password"}
              >
                {showPwdConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pwdSubmitting}
              className="h-11 min-w-[160px] rounded-lg border-0 bg-[#257d2a] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1f6823] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pwdSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Make Store Inactive Modal */}
      {showInactiveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowInactiveModal(false)}
        >
          <div
            className="w-full max-w-[500px] rounded-2xl bg-white p-6 sm:p-7 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Make Store Inactive
              </h3>
              <button
                type="button"
                onClick={() => setShowInactiveModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Subtitle */}
            <p className="mt-2 text-sm text-gray-800 font-medium">
              Your Store will stop accepting new orders while it is inactive
            </p>

            {/* Question */}
            <p className="mt-4 mb-3 text-sm font-semibold text-gray-900">
              Why are you returning this Products
            </p>

            {/* Radio Options */}
            <div className="space-y-2.5">
              {[
                "Product Arrived damaged",
                "Wrong product Recevied",
                "Product is defective",
                "Product is different from description",
                "Missing items / part",
                "Other",
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-800"
                >
                  <input
                    type="radio"
                    name="inactiveReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4 text-[#257d2a] focus:ring-[#257d2a] accent-[#257d2a]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {/* Additional Note */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Additional Note ( Optional )
              </label>
              <textarea
                rows={3}
                value={additionalNote}
                onChange={(e) => setAdditionalNote(e.target.value)}
                placeholder="Write your reason here...."
                className="w-full rounded-lg border border-gray-300 p-3 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#257d2a] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowInactiveModal(false)}
                className="flex-1 h-11 rounded-lg border border-black bg-white text-base font-semibold text-black hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={inactiveSubmitting}
                onClick={handleConfirmInactive}
                className="flex-1 h-11 rounded-lg border-0 bg-[#257d2a] text-base font-semibold text-white hover:bg-[#1f6823] transition-colors disabled:opacity-50"
              >
                {inactiveSubmitting ? "Updating..." : "Make Store Inactive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
