
import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
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
import customRequirementRoutes from '../routes/customRequirements';
import routes from '../routes/userRoutes';

dotenv.config();

const app: Express = express();

// Trust proxy is required when app is behind a reverse proxy (like Vercel)
// This fixes the express-rate-limit 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR' error
app.set('trust proxy', 1);

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all routes
app.use('/api', limiter);

// Special limiter for auth routes (more restrictive)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 auth requests per hour
  message: 'Too many login attempts from this IP, please try again after an hour'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/auth/login', authLimiter);

// 3. Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// 4. Prevent HTTP Parameter Pollution
app.use(hpp());

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400 // 24 hours
}));

app.use(bodyParser.json({ limit: '50mb' })); // Increased for image uploads
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Cookie parser middleware
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
app.use('/api/custom-requirements', customRequirementRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Database Connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('✗ MONGODB_URI is not defined in environment variables');
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      dbName: "dandldb",
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✓ Connected to MongoDB');
  } catch (error: any) {
    console.error('✗ MongoDB connection failed:', error.message);
  }
};

// Connect to DB (Vercel will execute this on cold start)
connectDB();

// Server Start (Only for local development, Vercel handles serving the exported app)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
  });
}

export default app;
