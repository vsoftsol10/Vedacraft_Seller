import { useEffect, useRef, useState } from "react";
import { FileText, Pencil, Plus, Upload, X } from "lucide-react";
import { getSellerDocuments, uploadSellerDocument } from "../api/productapi";

const TYPES = ["PAN Card", "GST Certificate", "Bank Account Proof", "Business Registration", "MFC Certificate", "Supporting Document"];

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

  useEffect(() => {
    getSellerDocuments().then(({ data }) => {
      setDocuments(data.filter((document) => document.uploaded).map((document) => ({ ...document, id: document.key, updatedAt: document.updatedAt ? new Date(document.updatedAt).toLocaleDateString("en-IN") : "" })));
    }).catch((error) => setLoadError(error?.response?.data?.message || "Unable to load your uploaded documents.")).finally(() => setLoading(false));
  }, []);

  const saveDocument = async () => {
    if (!selectedType || !selectedFile) return;
    setSaving(true); setUploadError("");
    try {
      const { data } = await uploadSellerDocument(selectedType, selectedFile);
      const next = { ...data, id: data.key, updatedAt: new Date(data.updatedAt).toLocaleDateString("en-IN") };
      setDocuments((current) => [...current.filter((document) => document.type !== next.type), next]);
      setUploadOpen(false); setEditing(null); setSelectedType(""); setSelectedFile(null);
    } catch (error) { setUploadError(error?.response?.data?.message || "Unable to upload document."); }
    finally { setSaving(false); }
  };
  const openUpload = (document = null) => { setEditing(document); setSelectedType(document?.type || ""); setSelectedFile(null); setUploadOpen(true); };

  return <div className="flex max-w-[1100px] flex-col gap-5 pb-8 pt-2">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="m-0 text-[26px] font-bold text-gray-900 sm:text-[32px]">Documents</h1><p className="mb-0 mt-1.5 text-[15px] text-gray-700">Upload and manage your required documents.</p></div><button type="button" onClick={() => openUpload()} className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded border border-amber-300 bg-amber-200 px-4 text-sm font-semibold text-gray-900 hover:bg-amber-300"><Plus size={16} /> Upload Document</button></header>
    {loadError && <p className="m-0 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>}<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{loading ? <p className="text-sm text-gray-500">Loading documents…</p> : TYPES.map((type) => { const document = documents.find((item) => item.type === type); return <article key={type} className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4"><div className="mb-3 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><FileText size={16} className="shrink-0 text-green-700" /><h2 className="truncate text-sm font-semibold text-gray-900">{type}</h2></div><span className={`rounded px-2 py-1 text-[11px] font-semibold ${document ? "bg-green-100 text-green-700" : "bg-amber-50 text-amber-700"}`}>{document ? "Uploaded" : "Required"}</span></div>{document ? <><div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-gray-100"><FileText size={36} className="text-gray-400" /></div><p className="truncate text-xs text-gray-600" title={document.name}>{document.name}</p><p className="mb-3 text-xs text-gray-400">Updated {document.updatedAt}</p><div className="grid grid-cols-2 gap-2"><a href={document.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded border border-gray-300 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">View</a><button type="button" onClick={() => openUpload(document)} className="flex cursor-pointer items-center justify-center gap-1 rounded border border-green-300 bg-green-50 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"><Pencil size={13} /> Replace</button></div></> : <div className="flex h-[178px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50"><FileText size={30} className="text-gray-400" /><button type="button" onClick={() => { setEditing(null); setSelectedType(type); setSelectedFile(null); setUploadOpen(true); }} className="cursor-pointer rounded border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"><Upload size={13} className="mr-1 inline" /> Upload</button></div>}</article>; })}</section>
    {uploadOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-[480px] rounded-xl bg-white p-5 shadow-2xl"><header className="mb-4 flex items-center justify-between"><h2 className="m-0 text-lg font-bold">{editing ? "Replace Document" : "Upload Document"}</h2><button type="button" onClick={() => setUploadOpen(false)} className="cursor-pointer border-0 bg-transparent text-gray-500"><X size={20} /></button></header><label className="mb-4 flex flex-col gap-1.5 text-sm font-medium">Document Type<select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} disabled={Boolean(editing)} className="h-11 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600"><option value="">Select document type</option>{TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><button type="button" onClick={() => inputRef.current?.click()} className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-600 hover:bg-green-50"><Upload size={22} className="text-green-700" />{selectedFile ? selectedFile.name : "Click to choose PDF, PNG, or JPG (max 10 MB)"}</button><input ref={inputRef} type="file" className="hidden" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />{uploadError && <p className="mb-0 mt-3 text-sm text-red-700">{uploadError}</p>}<footer className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setUploadOpen(false)} disabled={saving} className="cursor-pointer rounded border border-gray-300 bg-white px-4 py-2 text-sm">Cancel</button><button type="button" onClick={saveDocument} disabled={!selectedType || !selectedFile || saving} className="cursor-pointer rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Uploading..." : "Upload"}</button></footer></section></div>}
  </div>;
}
