import { IndianRupee, Package, ShoppingBag, Star } from "lucide-react";

export const ORDER_STAT_CARDS = [
  { key: "new", label: "New Order", value: 20, delta: "+12", icon: ShoppingBag, iconClass: "bg-[#fef3c7] text-[#d97706]" },
  { key: "shipped", label: "Shipped", value: 10, delta: "+12", icon: IndianRupee, iconClass: "bg-[#d1fae5] text-[#059669]" },
  { key: "delivered", label: "Delivered", value: 20, delta: "+12", icon: Package, iconClass: "bg-[#d1fae5] text-[#059669]" },
  { key: "returned", label: "Returned", value: 4, delta: "+12", icon: Star, iconClass: "bg-[#fef3c7] text-[#d97706]" },
];

export const MOCK_ORDERS = [
  { id: "#VC10345", customer: "Meera Iyer", product: "Bamboo Bottle", items: 2, amount: "₹1,000", status: "Processing", payment: "GPay", date: "18/11/26" },
  { id: "#VC10346", customer: "Arjun Nair", product: "Bamboo Bottle", items: 1, amount: "₹1,000", status: "Shipped", payment: "UPI", date: "20/11/26" },
  { id: "#VC10347", customer: "Priya Das", product: "Bamboo Bottle", items: 1, amount: "₹1,000", status: "Delivered", payment: "UPI", date: "24/11/26" },
];
