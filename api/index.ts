
import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { errorHandler } from '../middleware/errorHandler';

// Routes
import authRoutes from '../routes/auth';
import adminAuthRoutes from '../routes/adminAuth';
import adminRoutes from '../routes/admin';
import productRoutes from '../routes/products';
import apiProductRoutes from '../routes/apiProducts';
import bookingRoutes from '../routes/bookings';
import paymentRoutes from '../routes/payment';
import favoritesRoutes from '../routes/favorites';
import deliveryRoutes from '../routes/delivery';
import routes from '../routes/userRoutes';

dotenv.config();

const app: Express = express();

// CORS Configuration - Production Ready
const allowedOrigins = [
  'http://localhost:3000', // Local development
  'http://localhost:5000', // Local development (self)
  'https://dandlfurnitech.vercel.app', // Production frontend
  'https://thewoodenspace.com', // Custom domain
  'https://www.thewoodenspace.com', // Custom domain with www
  process.env.FRONTEND_URL // Production frontend from env
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  next();
});

// Cookie parser middleware (if using cookies)
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Routes
app.use('/api', routes)
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/delivery', deliveryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Database Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://dlfurniture99_db_user:fDdaaPnkkQWXdDj2@cluster0.hisi1qq.mongodb.net';

mongoose.connect(mongoUri, {
  dbName: "dandldb",
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✓ Connected to MongoDB');
  })
  .catch((err: any) => {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

export default app;
