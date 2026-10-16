export const BUSINESS_CATEGORIES = [
  "Eco Products",
  "Natural Products",
  "Handmade Products",
  "Eco-Friendly Fashion",
  "Organic Food",
  "Sustainable Home & Living",
  "Natural Beauty & Personal Care",
  "Upcycled & Recycled Products",
  "Bamboo & Jute Products",
  "Handloom & Textiles",
  "Organic Gardening",
  "Eco-Friendly Stationery & Gifting",
  "Zero-Waste Essentials",
  "Other",
];

export const categoryValue = (value) => {
  const match = BUSINESS_CATEGORIES.find((category) => category.toLowerCase() === String(value || "").trim().toLowerCase());
  return match || value || "";
};
