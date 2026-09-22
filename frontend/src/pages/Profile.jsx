import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { fetchProfile, saveProfile, parseApiError } from '../api/profileapi';

const EMPTY = { fullName: '', email: '', mobileNumber: '', alternateNumber: '' };
const FIELDS = Object.keys(EMPTY);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const INPUT = "h-[58px] rounded-md border border-[#d9d9d9] bg-white px-3.5 text-[#111] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#b5b5b5] focus-visible:border-[#279a3a] focus-visible:shadow-[0_0_0_3px_rgba(39,154,58,.18)]";
const FIELD_ERROR_INPUT = "border-[#c62828] focus-visible:shadow-[0_0_0_3px_rgba(198,40,40,.16)]";

// Mirrors the backend rules so people get feedback before the request is sent.
function validate(v) {
  const e = {};
  const name = v.fullName.trim();
  if (!name) e.fullName = 'Full name is required';
  else if (name.length < 2) e.fullName = 'Full name must be at least 2 characters';

  if (!v.email.trim()) e.email = 'Email address is required';
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address';

  if (!v.mobileNumber) e.mobileNumber = 'Mobile number is required';
  else if (!PHONE_RE.test(v.mobileNumber)) e.mobileNumber = 'Enter a valid 10-digit mobile number';

  if (v.alternateNumber) {
    if (!PHONE_RE.test(v.alternateNumber)) e.alternateNumber = 'Enter a valid 10-digit mobile number';
    else if (v.alternateNumber === v.mobileNumber) e.alternateNumber = 'Must be different from your mobile number';
  }
  return e;
}

const toFormValues = (data) => ({
  fullName: data?.fullName ?? '',
  email: data?.email ?? '',
  mobileNumber: data?.mobileNumber ?? '',
  alternateNumber: data?.alternateNumber ?? '',
});

function Field({ id, label, optional, error, ...inputProps }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[1.1rem] font-medium" htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-[#9a9a9a]"> (optional)</span>}
      </label>
      <input
        id={id}
        name={id}
        className={`${INPUT}${error ? ` ${FIELD_ERROR_INPUT}` : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="m-0 text-[0.85rem] text-[#c62828]">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Profile() {
  const [saved, setSaved] = useState(EMPTY); // last values stored on the server
  const [savedImage, setSavedImage] = useState(null); // last stored image URL
  const [form, setForm] = useState(EMPTY);
  const [newImage, setNewImage] = useState(null); // { file, preview } picked but not saved
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', text }
  const fileInputRef = useRef(null);

  const applyProfile = useCallback((data) => {
    const values = toFormValues(data);
    setSaved(values);
    setForm(values);
    setSavedImage(data?.profileImage ?? null);
    setNewImage(null);
    setRemoveImage(false);
    setErrors({});
    setTouched({});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProfile();
        if (!cancelled) applyProfile(data);
      } catch (err) {
        if (!cancelled) setBanner({ type: 'error', text: parseApiError(err).message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyProfile]);

  const displayedImage = newImage?.preview ?? (removeImage ? null : savedImage);
  const dirty =
    FIELDS.some((k) => form[k] !== saved[k]) || newImage !== null || removeImage;

  function handleChange(e) {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'mobileNumber' || name === 'alternateNumber') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    const next = { ...form, [name]: value };
    setForm(next);
    setBanner(null);
    // Once a field has been visited, re-check it as the person types.
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validate(next)[name] }));
    // If the mobile number changes, the alternate-number "must differ" rule may change too.
    if (name === 'mobileNumber' && touched.alternateNumber) {
      setErrors((prev) => ({ ...prev, alternateNumber: validate(next).alternateNumber }));
    }
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(form)[name] }));
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again later
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, profileImage: 'Only PNG or JPG images are allowed' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((prev) => ({ ...prev, profileImage: 'Image must be 2 MB or smaller' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewImage({ file, preview: reader.result });
      setRemoveImage(false);
      setErrors((prev) => ({ ...prev, profileImage: undefined }));
      setBanner(null);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setNewImage(null);
    if (savedImage) setRemoveImage(true);
    setErrors((prev) => ({ ...prev, profileImage: undefined }));
    setBanner(null);
  }

  function handleCancel() {
    setForm(saved);
    setNewImage(null);
    setRemoveImage(false);
    setErrors({});
    setTouched({});
    setBanner(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;

    const found = validate(form);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setTouched({ fullName: true, email: true, mobileNumber: true, alternateNumber: true });
      document.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }

    setSaving(true);
    setBanner(null);
    try {
      const data = await saveProfile(form, {
        imageFile: newImage?.file,
        removeImage,
      });
      applyProfile(data);
      window.dispatchEvent(new Event('seller-profile-updated'));
      setBanner({ type: 'success', text: 'Profile saved' });
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setBanner({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[1160px] pb-12 pt-2 text-[#111]">
      <h1 className="mb-1.5 mt-0 text-[2.25rem] font-bold leading-[1.15] max-[768px]:text-[1.75rem]">Profile</h1>
      <p className="mb-6 mt-0 text-[0.95rem]">Manage your personal and store profile information.</p>

      {banner && (
        <div
          className={`mb-5 rounded-md px-4 py-3 text-[0.95rem] ${banner.type === 'success' ? 'border border-[#b7dfc0] bg-[#e6f5e9] text-[#1b5e28]' : 'border border-[#f5c2be] bg-[#fdecea] text-[#8e1c17]'}`}
          role={banner.type === 'error' ? 'alert' : 'status'}
        >
          {banner.text}
        </div>
      )}

      {loading ? (
        <p className="text-[#9a9a9a]">Loading your profile…</p>
      ) : (
        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 max-[768px]:grid-cols-1">
            <Field
              id="fullName"
              label="Full Name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={form.fullName}
              error={errors.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <Field
              id="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              error={errors.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <Field
              id="mobileNumber"
              label="Mobile Number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit mobile number"
              value={form.mobileNumber}
              error={errors.mobileNumber}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <Field
              id="alternateNumber"
              label="Alternate Number"
              optional
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              value={form.alternateNumber}
              error={errors.alternateNumber}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <div className="relative mt-8 w-40">
            <button
              type="button"
              className={`flex h-[138px] w-40 cursor-pointer flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg border border-[#d9d9d9] bg-white p-2 text-[0.7rem] leading-[1.4] text-[#9a9a9a] transition-[border-color] duration-150 hover:border-[#279a3a] focus-visible:border-[#279a3a] focus-visible:outline-none${displayedImage ? ' p-0' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              aria-label={displayedImage ? 'Change profile image' : 'Upload profile image'}
            >
              {displayedImage ? (
                <img className="h-full w-full object-cover" src={displayedImage} alt="Profile preview" />
              ) : (
                <>
                  <Upload className="mb-1.5" size={26} strokeWidth={1.5} aria-hidden="true" />
                  <span>Upload Profile Image</span>
                  <span>PNG, JPG</span>
                  <span>(Max 2MB)</span>
                </>
              )}
            </button>
            {displayedImage && (
              <button
                type="button"
                className="absolute -right-2 -top-2 grid h-6 w-6 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#333] p-0 text-white hover:bg-[#c62828]"
                onClick={handleRemoveImage}
                aria-label="Remove profile image"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFile}
              hidden
            />
            {errors.profileImage && <p className="mt-2 max-w-[260px] w-max text-[0.85rem] text-[#c62828]">{errors.profileImage}</p>}
          </div>

          <div className="mt-14 flex justify-end gap-5 max-[768px]:mt-10 max-[768px]:flex-col-reverse">
            <button
              type="button"
              className="h-[55px] w-[220px] cursor-pointer rounded border border-[#111] bg-white text-[1.2rem] font-medium text-[#111] transition-[background-color,opacity] duration-150 enabled:hover:bg-[#f4f4f4] focus-visible:outline-3 focus-visible:outline-[rgba(39,154,58,.4)] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-[768px]:w-full"
              onClick={handleCancel}
              disabled={!dirty || saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[55px] w-[220px] cursor-pointer rounded border border-[#279a3a] bg-[#279a3a] text-[1.2rem] font-medium text-white transition-[background-color,opacity] duration-150 enabled:hover:bg-[#1f7f2f] focus-visible:outline-3 focus-visible:outline-[rgba(39,154,58,.4)] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-[768px]:w-full"
              disabled={!dirty || saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
