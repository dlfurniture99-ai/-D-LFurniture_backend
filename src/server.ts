import dotenv from "dotenv";
dotenv.config(); // MUST be first

import express from "express";
import cors from "cors";
import connectDB from "./config/db";

import authRoutes from "./routes/auth.routes";
import furnitureRoutes from "./routes/furniture.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import userRoutes from "./routes/user.routes";
import paymentRoutes from "./routes/payment.routes";
import categoryRoutes from "./routes/category.routes";

const app = express();

/* ===============================
   🔥 VERCEL CORS FIX (REQUIRED)
================================ */
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://d-l-furniture-frontend.vercel.app"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

/* ===============================
   NORMAL CORS (LOCAL + PROD)
================================ */
app.use(
  cors({
    origin: [
      "https://d-l-furniture-frontend.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);

/* ===============================
   BODY PARSERS
================================ */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ===============================
   DB CONNECTION
================================ */
connectDB();

/* ===============================
   ROUTES
================================ */
app.use("/api/auth", authRoutes);
app.use("/api/furniture", furnitureRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/categories", categoryRoutes);

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running 🚀" });
});

/* ===============================
   LOCAL DEV SERVER
================================ */
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log(`✅ Server running on port ${PORT}`)
  );
}

export default app;
