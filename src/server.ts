import dotenv from 'dotenv';
dotenv.config(); // Must be FIRST before any imports that use env vars

import express from 'express';
import cors from 'cors';
import connectDB from './config/db';

import authRoutes from './routes/auth.routes';
import furnitureRoutes from './routes/furniture.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import wishlistRoutes from './routes/wishlist.routes';
import userRoutes from './routes/user.routes';
import paymentRoutes from './routes/payment.routes';
import categoryRoutes from './routes/category.routes';

const app = express();

// DB connect (safe for serverless)
connectDB();

// CORS (FIXED)
app.use(cors({
  origin: [
    'https://d-l-furniture-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 🔥 REQUIRED for preflight
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/furniture', furnitureRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/categories', categoryRoutes);

// Start server
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

export default app;
