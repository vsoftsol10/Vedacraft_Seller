
// import { X } from "lucide-react";

// /* ---------- Tailwind class constants ---------- */
// const BACKDROP =
//   "fixed inset-0 z-20 grid place-items-center bg-[rgba(19,28,22,0.48)] p-6 max-[640px]:p-3";
// const MODAL =
//   "flex h-[min(860px,calc(100vh-48px))] w-[min(1100px,100%)] flex-col overflow-hidden rounded-[20px] bg-[#fafafa] shadow-[0_24px_60px_rgba(0,0,0,0.22)]";
// const HEADER =
//   "z-[2] flex items-start justify-between gap-4 border-b border-[#eee] bg-white px-6 py-5 max-[640px]:p-[18px]";
// const HEADER_ID = "mb-1 text-[13px] text-[#777]";
// const HEADER_TITLE = "text-[23px]";
// const CLOSE_BTN =
//   "grid h-[38px] w-[38px] flex-none cursor-pointer place-items-center rounded-lg border border-[#e5e5e5] bg-white text-[#394150] hover:bg-[#f5f5f5]";

// const SCROLL = "min-h-0 overflow-y-auto";
// const IMAGES =
//   "mx-6 mt-5 flex gap-3 overflow-x-auto rounded-2xl border border-[#eee] bg-white p-[18px] max-[640px]:mx-[18px] max-[640px]:mt-[18px]";
// const IMAGE = "h-[132px] w-[132px] flex-none rounded-xl bg-[#f4f4f4] object-cover";

// const CONTENT = "flex flex-col gap-5 px-6 pt-5 pb-6 max-[640px]:p-[18px]";
// const SECTION = "rounded-2xl border border-[#eee] bg-white p-6 max-[640px]:p-[18px]";
// const SECTION_TITLE = "mb-4 text-[16px]";
// const GRID =
//   "grid grid-cols-[repeat(3,1fr)] gap-5 max-[640px]:grid-cols-[repeat(2,1fr)] max-[640px]:gap-[14px]";
// const ITEM = "min-w-0";
// const ITEM_LABEL = "mb-[7px] block text-[13px] font-semibold text-[#333]";
// const ITEM_VALUE =
//   "block min-h-[42px] [overflow-wrap:anywhere] whitespace-pre-wrap rounded-[10px] border border-[#ddd] bg-white px-3 py-2.5 text-[14px] leading-5 font-normal text-[#263243]";

// const money = (amount) => `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
// const shown = (value) => value || "—";

// export default function ProductDetails({ product, onClose }) {
//   if (!product) return null;
//   const images = [product.images?.cover, ...(product.images?.additional ?? [])].filter(Boolean);
//   const pricing = product.pricing ?? {}, inventory = product.inventory ?? {}, dimensions = product.dimensions ?? {}, usage = product.usage ?? {};
//   return (
//     <div className={BACKDROP} onMouseDown={onClose} role="presentation">
//       <section
//         className={MODAL}
//         onMouseDown={(event) => event.stopPropagation()}
//         role="dialog"
//         aria-modal="true"
//       >
//         <header className={HEADER}>
//           <div>
//             <p className={HEADER_ID}>{product.productId}</p>
//             <h2 className={HEADER_TITLE}>{product.productName}</h2>
//           </div>
//           <button className={CLOSE_BTN} onClick={onClose} aria-label="Close">
//             <X size={20} />
//           </button>
//         </header>
//         <div className={SCROLL}>
//           {images.length > 0 && (
//             <div className={IMAGES}>
//               {images.map((src, index) => (
//                 <img key={src} className={IMAGE} src={src} alt={`${product.productName} ${index + 1}`} />
//               ))}
//             </div>
//           )}
//           <div className={CONTENT}>
//             <Section title="Basic information">
//               <Detail label="Category" value={product.category} />
//               <Detail label="Sub category" value={product.subCategory} />
//               <Detail label="Material" value={product.material} />
//               <Detail label="Quantity" value={product.weight} />
//               <Detail label="Description" value={product.description} full />
//               <Detail label="Benefits" value={product.benefits} full />
//               <Detail label="Highlights" value={product.highlights} full />
//             </Section>
//             <Section title="Dimensions">
//               <Detail label="Length" value={dimensions.length} />
//               <Detail label="Width" value={dimensions.width} />
//               <Detail label="Height" value={dimensions.height} />
//             </Section>
//             <Section title="Pricing">
//               <Detail label="MRP" value={money(pricing.mrp)} />
//               <Detail label="Discount price" value={pricing.discountPrice ? money(pricing.discountPrice) : "—"} />
//               <Detail label="Selling price" value={money(pricing.sellingPrice)} />
//             </Section>
//             <Section title="Inventory">
//               <Detail label="SKU" value={inventory.sku} />
//               <Detail label="Stock quantity" value={inventory.stockQuantity} />
//               <Detail label="Low stock alert" value={inventory.lowStockAlert} />
//               <Detail label="Stock status" value={product.stockStatus} />
//             </Section>
//             <Section title="Usage & care">
//               <Detail label="How to use" value={usage.howToUse} />
//               <Detail label="Care instruction" value={usage.careInstruction} />
//             </Section>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

// function Section({ title, children }) {
//   return (
//     <section className={SECTION}>
//       <h3 className={SECTION_TITLE}>{title}</h3>
//       <div className={GRID}>{children}</div>
//     </section>
//   );
// }

// function Detail({ label, value, full = false }) {
//   return (
//     <div className={full ? `${ITEM} col-span-full` : ITEM}>
//       <span className={ITEM_LABEL}>{label}</span>
//       <strong className={ITEM_VALUE}>{shown(value)}</strong>
//     </div>
//   );
// }

import { X } from "lucide-react";

/* ---------- Tailwind class constants ---------- */
const BACKDROP =
  "fixed inset-0 z-[60] grid place-items-center bg-[rgba(19,28,22,0.48)] p-3 sm:p-6 max-[640px]:p-3";
const MODAL =
  "flex h-[min(860px,calc(100vh-32px))] sm:h-[min(860px,calc(100vh-48px))] w-[min(1100px,100%)] flex-col overflow-hidden rounded-[16px] sm:rounded-[20px] bg-[#fafafa] shadow-[0_24px_60px_rgba(0,0,0,0.22)]";
const HEADER =
  "z-[2] flex items-start justify-between gap-4 border-b border-[#eee] bg-white px-4 py-4 sm:px-6 sm:py-5 max-[640px]:p-[18px]";
const HEADER_ID = "mb-1 text-[13px] text-[#777]";
const HEADER_TITLE = "text-[19px] sm:text-[23px]";
const CLOSE_BTN =
  "grid h-[38px] w-[38px] flex-none cursor-pointer place-items-center rounded-lg border border-[#e5e5e5] bg-white text-[#394150] hover:bg-[#f5f5f5]";

const SCROLL = "min-h-0 overflow-y-auto";
const IMAGES =
  "mx-4 mt-4 flex gap-3 overflow-x-auto rounded-2xl border border-[#eee] bg-white p-3 sm:mx-6 sm:mt-5 sm:p-[18px] max-[640px]:mx-[18px] max-[640px]:mt-[18px]";
const IMAGE = "h-[100px] w-[100px] sm:h-[132px] sm:w-[132px] flex-none rounded-xl bg-[#f4f4f4] object-cover";

const CONTENT = "flex flex-col gap-5 px-4 pt-4 pb-5 sm:px-6 sm:pt-5 sm:pb-6 max-[640px]:p-[18px]";
const SECTION = "rounded-2xl border border-[#eee] bg-white p-4 sm:p-6 max-[640px]:p-[18px]";
const SECTION_TITLE = "mb-4 text-[16px]";
const GRID =
  "grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5";
const ITEM = "min-w-0";
const ITEM_LABEL = "mb-[7px] block text-[13px] font-semibold text-[#333]";
const ITEM_VALUE =
  "block min-h-[42px] [overflow-wrap:anywhere] whitespace-pre-wrap rounded-[10px] border border-[#ddd] bg-white px-3 py-2.5 text-[14px] leading-5 font-normal text-[#263243]";

const money = (amount) => `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
const shown = (value) => value || "—";

export default function ProductDetails({ product, onClose }) {
  if (!product) return null;
  const images = [product.images?.cover, ...(product.images?.additional ?? [])].filter(Boolean);
  const pricing = product.pricing ?? {}, inventory = product.inventory ?? {}, dimensions = product.dimensions ?? {}, usage = product.usage ?? {};
  return (
    <div className={BACKDROP} onMouseDown={onClose} role="presentation">
      <section
        className={MODAL}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className={HEADER}>
          <div>
            <p className={HEADER_ID}>{product.productId}</p>
            <h2 className={HEADER_TITLE}>{product.productName}</h2>
          </div>
          <button className={CLOSE_BTN} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className={SCROLL}>
          {images.length > 0 && (
            <div className={IMAGES}>
              {images.map((src, index) => (
                <img key={src} className={IMAGE} src={src} alt={`${product.productName} ${index + 1}`} />
              ))}
            </div>
          )}
          <div className={CONTENT}>
            <Section title="Basic information">
              <Detail label="Category" value={product.category} />
              <Detail label="Sub category" value={product.subCategory} />
              <Detail label="Material" value={product.material} />
              <Detail label="Quantity" value={product.weight} />
              <Detail label="Description" value={product.description} full />
              <Detail label="Benefits" value={product.benefits} full />
              <ListDetail label="Highlights" value={product.highlights} />
            </Section>
            <Section title="Dimensions">
              <Detail label="Length" value={dimensions.length} />
              <Detail label="Width" value={dimensions.width} />
              <Detail label="Height" value={dimensions.height} />
            </Section>
            <Section title="Pricing">
              <Detail label="MRP" value={money(pricing.mrp)} />
              <Detail label="Discount price" value={pricing.discountPrice ? money(pricing.discountPrice) : "—"} />
              <Detail label="Selling price" value={money(pricing.sellingPrice)} />
            </Section>
            <Section title="Inventory">
              <Detail label="SKU" value={inventory.sku} />
              <Detail label="Stock quantity" value={inventory.stockQuantity} />
              <Detail label="Low stock alert" value={inventory.lowStockAlert} />
              <Detail label="Stock status" value={product.stockStatus} />
            </Section>
            <Section title="Usage & care">
              <ListDetail label="How to use" value={usage.howToUse} numbered />
              <ListDetail label="Care instruction" value={usage.careInstruction} />
            </Section>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className={SECTION}>
      <h3 className={SECTION_TITLE}>{title}</h3>
      <div className={GRID}>{children}</div>
    </section>
  );
}

function Detail({ label, value, full = false }) {
  return (
    <div className={full ? `${ITEM} col-span-full` : ITEM}>
      <span className={ITEM_LABEL}>{label}</span>
      <strong className={ITEM_VALUE}>{shown(value)}</strong>
    </div>
  );
}

function ListDetail({ label, value, numbered = false }) {
  const entries = listEntries(value);
  return <div className={`${ITEM} col-span-full`}><span className={ITEM_LABEL}>{label}</span>{entries.length ? <ol className={`${ITEM_VALUE} m-0 list-inside ${numbered ? "list-decimal" : "list-disc"}`}>{entries.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ol> : <strong className={ITEM_VALUE}>â€”</strong>}</div>;
}

function listEntries(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch { /* legacy plain text */ }
  return String(value ?? "").split(/\r?\n|;/).map((item) => item.trim()).filter(Boolean);
}
