import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Pencil, Plus, Upload, X } from "lucide-react";
import { getSellerDocuments, replaceSellerDocument, uploadSellerDocument } from "../api/productapi";

const TYPES = ["PAN Card", "GST Certificate", "Bank Account Proof", "Business Registration", "Supporting Document"];
const SUPPORTING_DOCUMENT = "Supporting Document";
const UPLOADED_STATUSES = ["pending", "approved"];
const availableDocumentTypes = (documents) => TYPES.filter((type) => type === SUPPORTING_DOCUMENT || !documents.some((document) => document.type === type && UPLOADED_STATUSES.includes(document.status)));
const statusLabel = (status) => status ? `${status[0].toUpperCase()}${status.slice(1)}` : "Pending";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef(null);
  const availableTypes = useMemo(() => availableDocumentTypes(documents), [documents]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data } = await getSellerDocuments();
      setDocuments(data ?? []);
      setLoadError("");
    } catch (error) {
      setLoadError(error?.response?.data?.message || "Unable to load your uploaded documents.");
    } finally { setLoading(false); }
  };
  useEffect(() => { const timer = window.setTimeout(loadDocuments, 0); return () => window.clearTimeout(timer); }, []);

  const closeUpload = () => { if (saving) return; setUploadOpen(false); setEditing(null); setSelectedType(""); setSelectedFile(null); setUploadError(""); };
  const openUpload = (document = null, type = "") => { setEditing(document); setSelectedType(document?.type || type); setSelectedFile(null); setUploadError(""); setUploadOpen(true); };
  const saveDocument = async () => {
    if (!selectedType || !selectedFile || saving) return;
    setSaving(true); setUploadError("");
    try {
      if (editing) await replaceSellerDocument(editing.id, selectedFile);
      else await uploadSellerDocument(selectedType, selectedFile);
      await loadDocuments();
      setUploadOpen(false); setEditing(null); setSelectedType(""); setSelectedFile(null);
    } catch (error) { setUploadError(error?.response?.data?.message || "Unable to upload document."); }
    finally { setSaving(false); }
  };

  return <div className="flex max-w-[1100px] flex-col gap-5 pb-8 pt-2">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="m-0 text-[26px] font-bold text-gray-900 sm:text-[32px]">Documents</h1><p className="mb-0 mt-1.5 text-[15px] text-gray-700">Upload and manage your required documents.</p></div><button type="button" onClick={() => openUpload()} disabled={!availableTypes.length || loading} className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded border border-amber-300 bg-amber-200 px-4 text-sm font-semibold text-gray-900 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} /> Upload Document</button></header>
    {loadError && <p className="m-0 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>}
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{loading ? <p className="text-sm text-gray-500">Loading documents…</p> : TYPES.map((type) => {
      const document = documents.find((item) => item.type === type);
      const replaceable = document && UPLOADED_STATUSES.includes(document.status);
      return <article key={type} className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4"><div className="mb-3 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><FileText size={16} className="shrink-0 text-green-700" /><h2 className="truncate text-sm font-semibold text-gray-900">{type}</h2></div><span className={`rounded px-2 py-1 text-[11px] font-semibold ${document ? document.status === "rejected" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700" : "bg-amber-50 text-amber-700"}`}>{document ? statusLabel(document.status) : "Required"}</span></div>{document ? <><div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-gray-100"><FileText size={36} className="text-gray-400" /></div><p className="truncate text-xs text-gray-600" title={document.name}>{document.name}</p><p className="mb-3 text-xs text-gray-400">Updated {new Date(document.updatedAt).toLocaleDateString("en-IN")}</p><div className="grid grid-cols-2 gap-2"><a href={document.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded border border-gray-300 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">View</a>{replaceable ? <button type="button" onClick={() => openUpload(document)} className="flex cursor-pointer items-center justify-center gap-1 rounded border border-green-300 bg-green-50 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"><Pencil size={13} /> Replace</button> : <button type="button" onClick={() => openUpload(null, type)} className="flex cursor-pointer items-center justify-center gap-1 rounded border border-green-300 bg-white py-2 text-xs font-semibold text-green-700 hover:bg-green-50"><Upload size={13} /> Upload</button>}</div></> : <div className="flex h-[178px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50"><FileText size={30} className="text-gray-400" /><button type="button" onClick={() => openUpload(null, type)} className="cursor-pointer rounded border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"><Upload size={13} className="mr-1 inline" /> Upload</button></div>}</article>;
    })}</section>
    {uploadOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-[480px] rounded-xl bg-white p-5 shadow-2xl"><header className="mb-4 flex items-center justify-between"><h2 className="m-0 text-lg font-bold">{editing ? "Replace Document" : "Upload Document"}</h2><button type="button" onClick={closeUpload} disabled={saving} className="cursor-pointer border-0 bg-transparent text-gray-500 disabled:opacity-50"><X size={20} /></button></header><label className="mb-4 flex flex-col gap-1.5 text-sm font-medium">Document Type<select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} disabled={Boolean(editing) || saving} className="h-11 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600"><option value="">{availableTypes.length ? "Select document type" : "All documents uploaded"}</option>{(editing ? [selectedType] : availableTypes).map((type) => <option key={type}>{type}</option>)}</select></label><button type="button" onClick={() => inputRef.current?.click()} disabled={saving} className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"><Upload size={22} className="text-green-700" />{selectedFile ? selectedFile.name : "Click to choose PDF, PNG, or JPG (max 10 MB)"}</button><input ref={inputRef} type="file" className="hidden" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />{uploadError && <p className="mb-0 mt-3 text-sm text-red-700">{uploadError}</p>}<footer className="mt-5 flex justify-end gap-3"><button type="button" onClick={closeUpload} disabled={saving} className="cursor-pointer rounded border border-gray-300 bg-white px-4 py-2 text-sm disabled:opacity-50">Cancel</button><button type="button" onClick={saveDocument} disabled={!selectedType || !selectedFile || saving} className="cursor-pointer rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? (editing ? "Replacing..." : "Uploading...") : (editing ? "Replace" : "Upload")}</button></footer></section></div>}
  </div>;
}
