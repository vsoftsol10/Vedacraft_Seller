import { Lock } from "lucide-react";

export default function ReadOnlyField({ label, value, hint, className = "" }) {
  const optional = label.endsWith(" (optional)");
  const labelText = optional ? label.slice(0, -" (optional)".length) : label;
  const locked = labelText === "GST Number" || labelText === "PAN Number";
  const accountNumber = labelText === "Account Number";

  return <div className={"flex flex-col border-b border-[#f0f0f0] pb-4 last:border-b-0 " + className}>
    <dt className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[#6b7280]">
      {labelText}
      {optional && <span className="normal-case text-gray-400"> (optional)</span>}
      {locked && <Lock size={14} className="text-gray-400" aria-label="Locked" />}
    </dt>
    {value ? <dd className={"m-0 mt-1 break-words text-base font-semibold text-[#111827]" + (accountNumber ? " font-mono tracking-wider" : "")}>{value}</dd> : <dd className="m-0 mt-1 text-sm font-normal italic text-gray-400">Not provided</dd>}
    {hint && <p className="mb-0 mt-1 text-xs text-gray-500">{hint}</p>}
  </div>;
}
