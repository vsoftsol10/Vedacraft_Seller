// import { Check, Circle, CreditCard, Phone, X } from "lucide-react";
// import OrderStatusBadge from "./Orderstatusbadge";

// const TIMELINE = ["Order Received", "Processing", "Packed", "Shipped", "Delivered"];
// const STATUS_INDEX = { Placed: 0, Processing: 1, Shipped: 3, Delivered: 4, Returned: 0 };

// export default function OrderDetails({ order, onClose }) {
//   const currentStep = STATUS_INDEX[order.status] ?? 0;
//   const phone = order.phone ?? "Not available";
//   const address = order.address ?? "Not available";

//   return <div className="fixed inset-0 z-50 flex justify-end bg-[#1118272e]" onMouseDown={onClose}>
//     <aside className="h-full w-[min(720px,100vw)] overflow-y-auto bg-surface shadow-[-12px_0_30px_rgb(0_0_0_/_12%)]" aria-label={`Order details for ${order.id}`} onMouseDown={(event) => event.stopPropagation()}>
//       <header className="flex items-start justify-between p-[30px] max-[640px]:p-[22px]">
//         <div><h2 className="m-0 text-[23px] text-ink">Order {order.id}</h2><p className="mb-0 mt-1 text-[13px]">Placed on {order.date}</p></div><button type="button" className="cursor-pointer border-0 bg-transparent p-1 text-ink" onClick={onClose} aria-label="Close order details"><X size={30} /></button>
//       </header>

//       <section className="mx-[30px] border-b border-[#c9c9c9] py-[22px] max-[640px]:mx-[22px]">
//         <h3 className="m-0 text-lg text-ink">Customer Details</h3>
//         <div className="mt-[18px] flex items-center gap-3.5">
//           <span className="grid size-[50px] place-items-center rounded-full bg-[#d7d7d7] font-bold text-[#666]">{order.customer.charAt(0)}</span>
//           <div>
//             <strong className="block">{order.customer}</strong>
//             <span className="mt-1 flex items-center gap-1"><Phone size={13} /> {phone}</span></div></div></section>
//       <section className="mx-[30px] border-b border-[#c9c9c9] py-[22px] max-[640px]:mx-[22px]"><h3 className="m-0 text-lg text-ink">Delivery Address</h3><p className="mt-2.5 max-w-[560px] text-base text-[#657084]">{address}</p></section>
//       <section className="mx-[30px] border-b border-[#c9c9c9] py-[22px] max-[640px]:mx-[22px]"><h3 className="m-0 text-lg text-ink">Items Details</h3><div className="mx-2.5 my-3.5 flex items-center gap-3"><>{order.image ? <img className="grid size-16 place-items-center bg-[#faf2e6] object-cover text-[34px]" src={order.image} alt="" /> : <div className="grid size-16 place-items-center bg-[#faf2e6] text-[34px]">📦</div>}</><div><strong className="block">{order.product}</strong><span className="mt-1 block">{order.amount}</span></div><b className="ml-auto">{order.items}</b></div><div className="mt-2 flex justify-between"><strong>Total Amount</strong><strong>{order.amount}</strong></div></section>
//       <section className="mx-[30px] border-b border-[#c9c9c9] py-[22px] max-[640px]:mx-[22px]"><h3 className="m-0 text-lg text-ink">Payment Information</h3><p className="mt-3.5 flex items-center gap-2.5 text-[17px]"><CreditCard size={24} /> {order.payment === "GPay" ? "Google Pay" : order.payment}</p></section>
//       <section className="mx-[30px] border-b border-[#c9c9c9] py-[22px] max-[640px]:mx-[22px]"><div className="flex items-center justify-between"><h3 className="m-0 text-lg text-ink">Order Timeline</h3><OrderStatusBadge status={order.status} /></div><ol className="m-[18px_0_0_5px] list-none p-0">{TIMELINE.map((step, index) => <li className={`relative flex min-h-[63px] items-center gap-2 text-ink ${index <= currentStep ? "[&>svg]:fill-[#148a28] [&>svg]:text-[#148a28]" : ""} [&:not(:last-child)]:before:absolute [&:not(:last-child)]:before:left-[6px] [&:not(:last-child)]:before:top-[29px] [&:not(:last-child)]:before:h-[35px] [&:not(:last-child)]:before:w-px [&:not(:last-child)]:before:bg-[#d9dce0] [&:not(:last-child)]:before:content-[''] [&>svg]:relative [&>svg]:z-[1] [&>svg]:fill-white [&>svg]:text-[#d9dce0]`} key={step}>{index < currentStep ? <Check size={13} /> : <Circle size={13} />}<span>{step}</span></li>)}</ol></section>
//       <footer className="flex justify-end gap-5 p-[28px_30px] max-[640px]:gap-2.5 max-[640px]:p-[22px]"><button type="button" className="min-w-[180px] cursor-pointer rounded-[5px] border border-ink bg-surface px-7 py-3 text-lg font-bold max-[640px]:min-w-0 max-[640px]:flex-1" onClick={onClose}>Cancel</button><button type="button" className="min-w-[180px] cursor-pointer rounded-[5px] border border-[#28912d] bg-[#28912d] px-7 py-3 text-lg font-bold text-white max-[640px]:min-w-0 max-[640px]:flex-1" onClick={onClose}>Save</button></footer>
//     </aside>
//   </div>;
// }

// import { useState } from "react";
// import { Check, Circle, CreditCard, Phone, X } from "lucide-react";
// import OrderStatusBadge from "./Orderstatusbadge";

// const TIMELINE = ["Order Received", "Processing", "Packed", "Shipped", "Delivered"];
// const STATUS_INDEX = { Placed: 0, Processing: 1, Packed: 2, Shipped: 3, Delivered: 4, Returned: 0 };
// const EDITABLE_STATUSES = ["Processing", "Packed", "Shipped","Delivered"];

// export default function OrderDetails({ order, onClose, onUpdateStatus }) {
//   const [status, setStatus] = useState(order.status);
//   const [saveError, setSaveError] = useState("");
//   const currentStep = STATUS_INDEX[status] ?? 0;
//   const phone = order.phone ?? "Not available";
//   const address = order.address ?? "Not available";

//   const handleSave = async () => {
//     try {
//       setSaveError("");
//       await onUpdateStatus?.(order.rawId, status);
//       onClose();
//     } catch (requestError) {
//       setSaveError(requestError.response?.data?.message || "Unable to update order status.");
//     }
//   };

//   return <div className="fixed inset-0 z-50 flex justify-end bg-[#1118272e]" onMouseDown={onClose}>
//     <aside className="h-full w-[min(720px,100vw)] overflow-y-auto bg-surface shadow-[-12px_0_30px_rgb(0_0_0_/_12%)]" aria-label={`Order details for ${order.id}`} onMouseDown={(event) => event.stopPropagation()}>
//       <header className="flex items-start justify-between p-[30px] max-[640px]:p-[22px]">
//         <div><h2 className="m-0 text-[23px] text-ink">Order {order.id}</h2><p className="mb-0 mt-1 text-[13px]">Placed on {order.date}</p></div><button type="button" className="cursor-pointer border-0 bg-transparent p-1 text-ink" onClick={onClose} aria-label="Close order details"><X size={30} /></button>
//       </header>

//       <section className="mx-[30px] border-b border-[#c9c9c9] py-[22px] max-[640px]:mx-[22px]">
//         <h3 className="m-0 text-lg text-ink">Customer Details</h3>
//         <div className="mt-[18px] flex items-center gap-3.5">
//           <span className="grid size-[50px] place-items-center rounded-full bg-[#d7d7d7] font-bold text-[#666]">{order.customer.charAt(0)}</span>
//           <div>
//             <strong className="block">{order.customer}</strong>
//             <span className="mt-1 flex items-center gap-1"><Phone size={13} /> {phone}</span></div></div></section>
//       <section className="mx-[30px] border-b border-[#c9c9c9] py-[22px] max-[640px]:mx-[22px]"><h3 className="m-0 text-lg text-ink">Delivery Address</h3><p className="mt-2.5 max-w-[560px] text-base text-[#657084]">{address}</p></section>
//       <section className="mx-[30px] border-b border-[#c9c9c9] py-[22px] max-[640px]:mx-[22px]"><h3 className="m-0 text-lg text-ink">Items Details</h3><div className="mx-2.5 my-3.5 flex items-center gap-3"><>{order.image ? <img className="grid size-16 place-items-center bg-[#faf2e6] object-cover text-[34px]" src={order.image} alt="" /> : <div className="grid size-16 place-items-center bg-[#faf2e6] text-[34px]">📦</div>}</><div><strong className="block">{order.product}</strong><span className="mt-1 block">{order.amount}</span></div><b className="ml-auto">{order.items}</b></div><div className="mt-2 flex justify-between"><strong>Total Amount</strong><strong>{order.amount}</strong></div></section>
//       <section className="mx-[30px] border-b border-[#c9c9c9] py-[22px] max-[640px]:mx-[22px]"><p className="mt-3.5 flex items-center gap-2.5 text-[17px]"><CreditCard size={24} /> {order.payment === "GPay" ? "Google Pay" : order.payment}</p></section>
//       <section className="mx-[30px] border-b border-[#c9c9c9] py-[22px] max-[640px]:mx-[22px]">
//         <div className="flex items-center justify-between">
//           <h3 className="m-0 text-lg text-ink">Order Timeline</h3>
//           <select
//             className="cursor-pointer rounded-[5px] border border-[#c9c9c9] bg-surface px-3 py-1.5 text-sm font-medium text-ink"
//             value={status}
//             onChange={(event) => setStatus(event.target.value)}
//             aria-label="Update order status"
//           >
//             {EDITABLE_STATUSES.map((step) => <option key={step} value={step}>{step}</option>)}
//           </select>
//         </div>
//         <ol className="m-[18px_0_0_5px] list-none p-0">{TIMELINE.map((step, index) => <li className={`relative flex min-h-[63px] items-center gap-2 text-ink ${index <= currentStep ? "[&>svg]:fill-[#148a28] [&>svg]:text-[#148a28]" : ""} [&:not(:last-child)]:before:absolute [&:not(:last-child)]:before:left-[6px] [&:not(:last-child)]:before:top-[29px] [&:not(:last-child)]:before:h-[35px] [&:not(:last-child)]:before:w-px [&:not(:last-child)]:before:bg-[#d9dce0] [&:not(:last-child)]:before:content-[''] [&>svg]:relative [&>svg]:z-[1] [&>svg]:fill-white [&>svg]:text-[#d9dce0]`} key={step}>{index < currentStep ? <Check size={13} /> : <Circle size={13} />}<span>{step}</span></li>)}</ol>{saveError && <p className="m-0 mt-3 rounded-md bg-[#fef3f2] p-3 text-sm text-danger">{saveError}</p>}</section>
//       <footer className="flex justify-end gap-5 p-[28px_30px] max-[640px]:gap-2.5 max-[640px]:p-[22px]"><button type="button" className="min-w-[180px] cursor-pointer rounded-[5px] border border-ink bg-surface px-7 py-3 text-lg font-bold max-[640px]:min-w-0 max-[640px]:flex-1" onClick={onClose}>Cancel</button><button type="button" className="min-w-[180px] cursor-pointer rounded-[5px] border border-[#28912d] bg-[#28912d] px-7 py-3 text-lg font-bold text-white max-[640px]:min-w-0 max-[640px]:flex-1" onClick={handleSave}>Save</button></footer>
//     </aside>
//   </div>;
// }

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Circle, CreditCard, Phone, X } from "lucide-react";
import OrderStatusBadge from "./Orderstatusbadge";

const TIMELINE = ["Order Received", "Processing", "Packed", "Shipped", "Delivered"];
const STATUS_INDEX = { Placed: 0, Processing: 1, Packed: 2, Shipped: 3, Delivered: 4, Returned: 0 };
const EDITABLE_STATUSES = ["Processing", "Packed", "Shipped", "Delivered"];

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex min-w-[110px] cursor-pointer items-center justify-between gap-2 rounded-md border border-[#d5d5d5] bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-[0_1px_2px_rgb(0_0_0_/_5%)] transition-colors hover:border-[#28912d]"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Update order status"
      >
        {value}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-10 mt-1.5 w-full min-w-[130px] overflow-hidden rounded-md border border-[#e5e5e5] bg-surface py-1 shadow-[0_8px_20px_rgb(0_0_0_/_12%)]"
        >
          {EDITABLE_STATUSES.map((step) => (
            <li key={step} role="option" aria-selected={step === value}>
              <button
                type="button"
                className={`block w-full cursor-pointer px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                  step === value ? "bg-[#e8f5e9] text-[#148a28]" : "text-ink hover:bg-[#f4f4f4]"
                }`}
                onClick={() => {
                  onChange(step);
                  setOpen(false);
                }}
              >
                {step}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OrderDetails({ order, onClose, onUpdateStatus }) {
  const [status, setStatus] = useState(order.status);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const currentStep = STATUS_INDEX[status] ?? 0;
  const phone = order.phone ?? "Not available";
  const address = order.address ?? "Not available";

  const handleSave = async () => {
    if (!onUpdateStatus || isSaving) return;

    try {
      setIsSaving(true);
      setSaveError("");
      await onUpdateStatus(order.rawId, status);
      onClose();
    } catch (requestError) {
      setSaveError(requestError.response?.data?.message || "Unable to update order status.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1118272e]" onMouseDown={onClose}>
      <aside
        className="h-full w-[min(560px,100vw)] overflow-y-auto bg-surface shadow-[-12px_0_30px_rgb(0_0_0_/_12%)]"
        aria-label={`Order details for ${order.id}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between p-5">
          <div>
            <h2 className="m-0 text-xl text-ink">Order {order.id}</h2>
            <p className="mb-0 mt-0.5 text-[13px]">Placed on {order.date}</p>
          </div>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-1 text-ink"
            onClick={onClose}
            aria-label="Close order details"
          >
            <X size={22} />
          </button>
        </header>

        <section className="mx-5 border-b border-[#e5e5e5] py-4">
          <h3 className="m-0 text-base font-semibold text-ink">Customer Details</h3>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-[#d7d7d7] text-sm font-bold text-[#666]">
              {order.customer.charAt(0)}
            </span>
            <div>
              <strong className="block text-sm">{order.customer}</strong>
              <span className="mt-0.5 flex items-center gap-1 text-xs text-[#657084]">
                <Phone size={12} /> {phone}
              </span>
            </div>
          </div>
        </section>

        <section className="mx-5 border-b border-[#e5e5e5] py-4">
          <h3 className="m-0 text-base font-semibold text-ink">Delivery Address</h3>
          <p className="mt-1.5 max-w-[560px] text-sm text-[#657084]">{address}</p>
        </section>

        <section className="mx-5 border-b border-[#e5e5e5] py-4">
          <h3 className="m-0 text-base font-semibold text-ink">Items Details</h3>
          <div className="mt-2.5 flex items-center gap-2.5">
            {order.image ? (
              <img className="size-11 rounded object-cover" src={order.image} alt="" />
            ) : (
              <div className="grid size-11 place-items-center rounded bg-[#faf2e6] text-xl">📦</div>
            )}
            <div>
              <strong className="block text-sm">{order.product}</strong>
              <span className="mt-0.5 block text-sm">{order.amount}</span>
            </div>
            <b className="ml-auto text-sm">{order.items}</b>
          </div>
          <div className="mt-2.5 flex justify-between text-sm">
            <strong>Total Amount</strong>
            <strong>{order.amount}</strong>
          </div>
        </section>

        <section className="mx-5 border-b border-[#e5e5e5] py-4">
          <h3 className="m-0 text-base font-semibold text-ink">Payment Information</h3>
          <p className="mt-2 flex items-center gap-2 text-sm">
            <CreditCard size={18} /> {order.payment === "GPay" ? "Google Pay" : order.payment}
          </p>
        </section>

        <section className="mx-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-base font-semibold text-ink">Order Timeline</h3>
            <StatusDropdown value={status} onChange={setStatus} />
          </div>
          <ol className="m-0 mt-3 ml-[5px] list-none p-0">
            {TIMELINE.map((step, index) => (
              <li
                key={step}
                className={`relative flex min-h-[42px] items-center gap-2 text-sm text-ink ${
                  index <= currentStep ? "[&>svg]:fill-[#148a28] [&>svg]:text-[#148a28]" : ""
                } [&:not(:last-child)]:before:absolute [&:not(:last-child)]:before:left-[6px] [&:not(:last-child)]:before:top-[20px] [&:not(:last-child)]:before:h-[22px] [&:not(:last-child)]:before:w-px [&:not(:last-child)]:before:bg-[#d9dce0] [&:not(:last-child)]:before:content-[''] [&>svg]:relative [&>svg]:z-[1] [&>svg]:fill-white [&>svg]:text-[#d9dce0]`}
              >
                {index < currentStep ? <Check size={13} /> : <Circle size={13} />}
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {saveError && <p className="m-0 mt-3 rounded-md bg-[#fef3f2] p-3 text-sm text-danger">{saveError}</p>}
        </section>

        <footer className="flex justify-end gap-3 p-5">
          <button
            type="button"
            className="min-w-[110px] cursor-pointer rounded border border-ink bg-surface px-5 py-2 text-sm font-bold"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="min-w-[110px] cursor-pointer rounded border border-[#28912d] bg-[#28912d] px-5 py-2 text-sm font-bold text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
