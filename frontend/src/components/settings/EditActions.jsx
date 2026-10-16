import { Pencil } from "lucide-react";

export default function EditActions({ editing, saving, onEdit, onSave, onCancel }) {
  if (!editing) return <button type="button" onClick={onEdit} aria-label="Edit this section" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#2b7a1d] bg-white px-4 text-sm font-semibold text-[#2b7a1d] hover:bg-[#e4f4e2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b7a1d]"><Pencil size={17} />Edit</button>;
  return <div className="flex flex-wrap gap-3"><button type="button" onClick={onCancel} disabled={saving} className="h-10 rounded-md border border-gray-700 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button><button type="button" onClick={onSave} disabled={saving} className="h-10 rounded-md bg-[#2b7a1d] px-4 text-sm font-semibold text-white hover:bg-[#226216] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button></div>;
}
