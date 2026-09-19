import { X } from "lucide-react";
import "../../styles/productdetails.css";

const money = (amount) => `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
const shown = (value) => value || "—";

export default function ProductDetails({ product, onClose }) {
  if (!product) return null;
  const images = [product.images?.cover, ...(product.images?.additional ?? [])].filter(Boolean);
  const pricing = product.pricing ?? {}, inventory = product.inventory ?? {}, dimensions = product.dimensions ?? {}, usage = product.usage ?? {};
  return <div className="product-details-backdrop" onMouseDown={onClose} role="presentation">
    <section className="product-details-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
      <header className="product-details-header"><div><p>{product.productId}</p><h2>{product.productName}</h2></div><button className="details-close" onClick={onClose} aria-label="Close"><X size={20} /></button></header>
      <div className="product-details-scroll">
      {images.length > 0 && <div className="details-images">{images.map((src, index) => <img key={src} src={src} alt={`${product.productName} ${index + 1}`} />)}</div>}
      <div className="details-content">
        <Section title="Basic information"><Detail label="Category" value={product.category} /><Detail label="Sub category" value={product.subCategory} /><Detail label="Material" value={product.material} /><Detail label="Quantity" value={product.weight} /><Detail label="Description" value={product.description} full /><Detail label="Benefits" value={product.benefits} full /><Detail label="Highlights" value={product.highlights} full /></Section>
        <Section title="Dimensions"><Detail label="Length" value={dimensions.length} /><Detail label="Width" value={dimensions.width} /><Detail label="Height" value={dimensions.height} /></Section>
        <Section title="Pricing"><Detail label="MRP" value={money(pricing.mrp)} /><Detail label="Discount price" value={pricing.discountPrice ? money(pricing.discountPrice) : "—"} /><Detail label="Selling price" value={money(pricing.sellingPrice)} /></Section>
        <Section title="Inventory"><Detail label="SKU" value={inventory.sku} /><Detail label="Stock quantity" value={inventory.stockQuantity} /><Detail label="Low stock alert" value={inventory.lowStockAlert} /><Detail label="Stock status" value={product.stockStatus} /></Section>
        <Section title="Usage & care"><Detail label="How to use" value={usage.howToUse} /><Detail label="Care instruction" value={usage.careInstruction} /></Section>
      </div>
      </div>
    </section>
  </div>;
}
function Section({ title, children }) { return <section className="details-section"><h3>{title}</h3><div className="details-grid">{children}</div></section>; }
function Detail({ label, value, full = false }) { return <div className={full ? "detail-item full" : "detail-item"}><span>{label}</span><strong>{shown(value)}</strong></div>; }
