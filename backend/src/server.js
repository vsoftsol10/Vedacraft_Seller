import "dotenv/config";
import express from "express";
import cors from "cors";
import productRoutes from "./routes/productroutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import sellingLocationRoutes from "./routes/sellingLocationRoutes.js";
import bankDetailsRoutes from "./routes/bankDetailsRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import earningsRoutes from "./routes/earningsRoutes.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || "http://localhost:5173").split(",");

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/selling-locations", sellingLocationRoutes);
app.use("/api/bank-details", bankDetailsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/earnings", earningsRoutes);
app.get("/", (_req, res) => res.send("Veda Crafts API is running"));

app.use((error, _req, res, _next) => {
  console.error(error);
  const duplicate = error.code === "23505";
  res.status(duplicate ? 409 : error.status || 500).json({
    success: false,
    message: duplicate ? "Duplicate SKU or Product ID" : error.message || "Something went wrong",
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
