<<<<<<< HEAD
=======
// import { X } from "lucide-react";

// const money = (amount) => `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
// const shown = (value) => value || "—";

// export default function ProductDetails({ product, onClose }) {
//   if (!product) return null;
//   const images = [product.images?.cover, ...(product.images?.additional ?? [])].filter(Boolean);
//   const pricing = product.pricing ?? {}, inventory = product.inventory ?? {}, dimensions = product.dimensions ?? {}, usage = product.usage ?? {};
//   return <div className="fixed inset-0 z-20 grid place-items-center bg-[rgb(19_28_22_/_48%)] p-6 max-[640px]:p-3" onMouseDown={onClose} role="presentation">
//     <section className="flex h-[min(860px,calc(100vh-48px))] w-[min(1100px,100%)] flex-col overflow-hidden rounded-[20px] bg-canvas shadow-[0_24px_60px_rgb(0_0_0_/_22%)]" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
//       <header className="z-2 flex items-start justify-between gap-4 border-b border-border-muted bg-surface px-6 py-5 max-[640px]:p-[18px]"><div><p className="mb-1 mt-0 text-[13px] text-text-secondary">{product.productId}</p><h2 className="m-0 text-[23px]">{product.productName}</h2></div><button className="grid size-[38px] shrink-0 cursor-pointer place-items-center rounded-lg border border-input-border bg-surface text-[#394150] hover:bg-surface-hover" onClick={onClose} aria-label="Close"><X size={20} /></button></header>
//       <div className="min-h-0 overflow-y-auto">
//       {images.length > 0 && <div className="mt-5 flex gap-3 overflow-x-auto rounded-2xl border border-border-muted bg-surface p-[18px] mx-6 max-[640px]:mx-[18px] max-[640px]:mt-[18px]">{images.map((src, index) => <img className="size-[132px] shrink-0 rounded-xl bg-[#f4f4f4] object-cover" key={src} src={src} alt={`${product.productName} ${index + 1}`} />)}</div>}
//       <div className="px-6 pb-6 pt-5 max-[640px]:p-[18px]">
//         <Section title="Basic information"><Detail label="Category" value={product.category} /><Detail label="Sub category" value={product.subCategory} /><Detail label="Material" value={product.material} /><Detail label="Quantity" value={product.weight} /><Detail label="Description" value={product.description} full /><Detail label="Benefits" value={product.benefits} full /><Detail label="Highlights" value={product.highlights} full /></Section>
//         <Section title="Dimensions"><Detail label="Length" value={dimensions.length} /><Detail label="Width" value={dimensions.width} /><Detail label="Height" value={dimensions.height} /></Section>
//         <Section title="Pricing"><Detail label="MRP" value={money(pricing.mrp)} /><Detail label="Discount price" value={pricing.discountPrice ? money(pricing.discountPrice) : "—"} /><Detail label="Selling price" value={money(pricing.sellingPrice)} /></Section>
//         <Section title="Inventory"><Detail label="SKU" value={inventory.sku} /><Detail label="Stock quantity" value={inventory.stockQuantity} /><Detail label="Low stock alert" value={inventory.lowStockAlert} /><Detail label="Stock status" value={product.stockStatus} /></Section>
//         <Section title="Usage & care"><Detail label="How to use" value={usage.howToUse} /><Detail label="Care instruction" value={usage.careInstruction} /></Section>
//       </div>
//       </div>
//     </section>
//   </div>;
// }
// function Section({ title, children }) { return <section className="mt-5 rounded-2xl border border-border-muted bg-surface p-6 first:mt-0 max-[640px]:p-[18px]"><h3 className="mb-4 mt-0 text-base">{title}</h3><div className="grid grid-cols-3 gap-5 max-[640px]:grid-cols-2 max-[640px]:gap-[14px]">{children}</div></section>; }
// function Detail({ label, value, full = false }) { return <div className={`min-w-0${full ? " col-span-full" : ""}`}><span className="mb-[7px] block text-[13px] font-semibold text-text-primary">{label}</span><strong className="block min-h-[42px] overflow-wrap-anywhere rounded-[10px] border border-avatar bg-surface px-3 py-2.5 text-sm font-normal whitespace-pre-wrap leading-5 text-[#263243]">{shown(value)}</strong></div>; }

>>>>>>> 78e1cc33d0dad5fb46c601957e814d18b2277c7a
// src/components/products/ProductDetails.jsx
import { X } from "lucide-react";

/* ---------- Tailwind class constants ---------- */
const BACKDROP =
  "fixed inset-0 z-20 grid place-items-center bg-[rgba(19,28,22,0.48)] p-6 max-[640px]:p-3";
const MODAL =
  "flex h-[min(860px,calc(100vh-48px))] w-[min(1100px,100%)] flex-col overflow-hidden rounded-[20px] bg-[#fafafa] shadow-[0_24px_60px_rgba(0,0,0,0.22)]";
const HEADER =
  "z-[2] flex items-start justify-between gap-4 border-b border-[#eee] bg-white px-6 py-5 max-[640px]:p-[18px]";
const HEADER_ID = "mb-1 text-[13px] text-[#777]";
const HEADER_TITLE = "text-[23px]";
const CLOSE_BTN =
  "grid h-[38px] w-[38px] flex-none cursor-pointer place-items-center rounded-lg border border-[#e5e5e5] bg-white text-[#394150] hover:bg-[#f5f5f5]";

const SCROLL = "min-h-0 overflow-y-auto";
const IMAGES =
  "mx-6 mt-5 flex gap-3 overflow-x-auto rounded-2xl border border-[#eee] bg-white p-[18px] max-[640px]:mx-[18px] max-[640px]:mt-[18px]";
const IMAGE = "h-[132px] w-[132px] flex-none rounded-xl bg-[#f4f4f4] object-cover";

const CONTENT = "flex flex-col gap-5 px-6 pt-5 pb-6 max-[640px]:p-[18px]";
const SECTION = "rounded-2xl border border-[#eee] bg-white p-6 max-[640px]:p-[18px]";
const SECTION_TITLE = "mb-4 text-[16px]";
const GRID =
  "grid grid-cols-[repeat(3,1fr)] gap-5 max-[640px]:grid-cols-[repeat(2,1fr)] max-[640px]:gap-[14px]";
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
              <Detail label="Highlights" value={product.highlights} full />
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
              <Detail label="How to use" value={usage.howToUse} />
              <Detail label="Care instruction" value={usage.careInstruction} />
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