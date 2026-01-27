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

import serverless from "serverless-http";

const app = express();

/* CORS Configuration */
const allowedOrigins = [
  "https://d-l-furniture-frontend.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.options("*", cors());

/* Body parsers */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* Connect to DB middleware */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

/* Routes */
app.use("/api/auth", authRoutes);
app.use("/api/furniture", furnitureRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/categories", categoryRoutes);

/* Health check */
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running 🚀" });
});

/* Export the serverless handler */
export const handler = serverless(app);
