import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';

import authRoutes from './routes/auth.routes';
import furnitureRoutes from './routes/furniture.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import wishlistRoutes from './routes/wishlist.routes';
import userRoutes from './routes/user.routes';
import paymentRoutes from './routes/payment.routes';

dotenv.config();

const app = express();

// DB connect (safe for serverless)
connectDB();

// CORS (FIXED)
app.use(cors({
  origin: [
    'https://d-l-furniture-frontend.vercel.app'
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

export default app;
