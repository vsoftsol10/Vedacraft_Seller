import { ShoppingBag, IndianRupee, Package, Star } from "lucide-react";

export const ORDER_STAT_CARDS = [
  {
    key: "new",
    label: "New Order",
    value: 20,
    delta: "+12",
    icon: ShoppingBag,
    iconClass: "order-stat-card__icon--amber",
  },
  {
    key: "shipped",
    label: "Shipped",
    value: 10,
    delta: "+12",
    icon: IndianRupee,
    iconClass: "order-stat-card__icon--green",
  },
  {
    key: "delivered",
    label: "Delivered",
    value: 20,
    delta: "+12",
    icon: Package,
    iconClass: "order-stat-card__icon--green",
  },
  {
    key: "returned",
    label: "returned",
    value: 4,
    delta: "+12",
    icon: Star,
    iconClass: "order-stat-card__icon--amber",
  },
];

export const MOCK_ORDERS = [
  {
    id: "#VC10345",
    customer: "Meera Iyer",
    product: "Bamboo Bottle",
    items: 2,
    amount: "₹1,000",
    status: "Processing",
    payment: "G pay",
    date: "18/11/26",
  },
  {
    id: "#VC10346",
    customer: "Arjun Nair",
    product: "Bamboo Bottle",
    items: 1,
    amount: "₹1,000",
    status: "Shipped",
    payment: "Eco",
    date: "20/11/26",
  },
  {
    id: "#VC10347",
    customer: "Priya Das",
    product: "Bamboo Bottle",
    items: 1,
    amount: "₹1,000",
    status: "Delivered",
    payment: "Eco",
    date: "24/11/26",
  },
];