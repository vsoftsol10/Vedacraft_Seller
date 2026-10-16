import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, Trash2, User } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePhotoUploader({
  imageUrl,
  onSelect,
  onRemove,
  maxSizeMB = 2,
  isUploading = false,
}) {
  const inputRef = useRef(null);
  const previewUrlRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [removed, setRemoved] = useState(false);
  const busy = uploading || removing || isUploading;
  const displayUrl = previewUrl || (removed ? null : imageUrl);
  const hasSavedPhoto = Boolean(imageUrl) && !removed;

  const revokePreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  };

  useEffect(() => () => revokePreview(), []);

  const openPicker = () => {
    if (!busy) inputRef.current?.click();
  };

  const selectPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError("This photo is too large. Please choose one under " + maxSizeMB + " MB.");
      return;
    }

    revokePreview();
    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;
    setPreviewUrl(nextPreview);
    setRemoved(false);
    setError("");
    setUploading(true);
    try {
      await onSelect(file);
    } catch {
      revokePreview();
      setPreviewUrl(null);
      setError("We couldn't upload your photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    setRemoving(true);
    setError("");
    try {
      await onRemove();
      revokePreview();
      setPreviewUrl(null);
      setRemoved(true);
      setConfirmingRemoval(false);
    } catch {
      setError("We couldn't remove your photo. Please try again.");
    } finally {
      setRemoving(false);
    }
  };

  return <section className="my-6 w-full max-w-[780px] rounded-xl border border-[#e5e5e5] bg-white p-5 sm:p-6" aria-labelledby="profile-photo-heading">
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:text-left">
      <div className="relative h-28 w-28 shrink-0">
        <div role="button" tabIndex={busy ? -1 : 0} onClick={openPicker} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openPicker(); } }} aria-label={displayUrl ? "Change profile photo" : "Upload profile photo"} className="h-28 w-28 cursor-pointer overflow-hidden rounded-full ring-4 ring-[#e4f4e2] outline-none focus-visible:ring-4 focus-visible:ring-[#2b7a1d] focus-visible:ring-offset-2">
          {displayUrl ? <img src={displayUrl} alt="Profile preview" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center bg-[#e4f4e2] text-[#2b7a1d]"><User size={48} strokeWidth={1.5} /></span>}
          {busy && <span className="absolute inset-0 grid place-items-center rounded-full bg-black/35 text-white"><LoaderCircle className="animate-spin" size={28} aria-label={removing ? "Removing photo" : "Uploading photo"} /></span>}
        </div>
        <button type="button" onClick={openPicker} disabled={busy} aria-label={displayUrl ? "Change profile photo" : "Upload profile photo"} className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#2b7a1d] text-white shadow-sm outline-none hover:bg-[#226216] focus-visible:ring-4 focus-visible:ring-[#2b7a1d] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"><Camera size={18} /></button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center sm:items-start">
        <h2 id="profile-photo-heading" className="m-0 text-base font-semibold text-[#111]">Profile photo</h2>
        <p className="mb-4 mt-1 text-center text-sm text-[#666] sm:text-left">Buyers see this photo on your store. JPG, PNG or WebP, up to {maxSizeMB} MB.</p>
        {confirmingRemoval ? <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start"><span className="text-sm font-medium text-[#111]">Remove this photo?</span><button type="button" onClick={removePhoto} disabled={busy} className="h-10 rounded-md bg-[#b42318] px-3 text-sm font-semibold text-white hover:bg-[#8e1c17] disabled:cursor-not-allowed disabled:opacity-60">{removing ? "Removing…" : "Yes, remove"}</button><button type="button" onClick={() => setConfirmingRemoval(false)} disabled={busy} className="h-10 rounded-md border border-[#d9d9d9] bg-white px-3 text-sm font-semibold text-[#333] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60">Keep</button></div> : <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start"><button type="button" onClick={openPicker} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2b7a1d] px-4 text-sm font-semibold text-white hover:bg-[#226216] disabled:cursor-not-allowed disabled:opacity-60"><Camera size={17} />{busy ? "Uploading…" : displayUrl ? "Change photo" : "Upload photo"}</button>{hasSavedPhoto && <button type="button" onClick={() => setConfirmingRemoval(true)} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#f0c4c0] bg-white px-3 text-sm font-semibold text-[#b42318] hover:bg-[#fff1f0] disabled:cursor-not-allowed disabled:opacity-60"><Trash2 size={17} />Remove</button>}</div>}
        {error && <p className="mb-0 mt-3 text-sm text-[#b42318]" role="alert">{error}</p>}
      </div>
    </div>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} hidden />
  </section>;
}
