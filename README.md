# D&L Furniture Backend API

Production-ready Node.js + Express + TypeScript + MongoDB backend for D&L Furniture E-commerce platform.

## 🚀 Features

- **Authentication**: JWT-based authentication with role-based access control (Admin/Buyer)
- **Furniture Management**: Full CRUD operations for furniture products (Admin only)
- **Shopping Cart**: Add, remove, update quantities, and manage cart items
- **Orders**: Create orders from cart, track order status, view order history
- **Wishlist**: Save favorite furniture items, add/remove from wishlist
- **Search & Filtering**: Advanced search with pagination, price range filtering, and category filtering
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Validation**: Input validation using Zod schema validation

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js >= 16.x
- MongoDB >= 4.4
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
```bash
cd D-L-Furniture-Backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

4. **Configure .env file**
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/d-l-furniture

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-key-change-this

# Server Port
PORT=5000

# Admin Credentials
ADMIN_EMAIL=admin@danl.com
ADMIN_PASSWORD=admin123

# Environment
NODE_ENV=development
```

5. **Start MongoDB**
```bash
# Using Docker (optional)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use local MongoDB
mongod
```

6. **Run development server**
```bash
npm run dev
```

Server will be running at `http://localhost:5000`

## 📦 Build & Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "64f...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "buyer",
      "createdAt": "2024-01-17T10:00:00Z"
    }
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Furniture Endpoints

#### Get All Furniture (Public)
```http
GET /furniture?page=1&limit=20&category=sofas&minPrice=10000&maxPrice=50000&search=wooden&sortBy=price
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `category` (string, optional)
- `minPrice` (number, optional)
- `maxPrice` (number, optional)
- `search` (string, optional)
- `sortBy` (enum: price, rating, newest, bestsellers, optional)

**Response:**
```json
{
  "success": true,
  "message": "Furniture fetched",
  "data": {
    "furniture": [
      {
        "_id": "64f...",
        "name": "Wooden Sofa Set",
        "price": 24999,
        "mrp": 49999,
        "category": "sofas",
        "description": "Premium solid wood sofa...",
        "image": "/sofa.png",
        "images": ["/sofa.png", ...],
        "discount": 50,
        "rating": 4.5,
        "reviews": 234,
        "badge": "Sale",
        "isBestSeller": true,
        "emiText": "From ₹1,042/month",
        "stock": 15,
        "createdAt": "2024-01-10T...",
        "updatedAt": "2024-01-10T..."
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
}
```

#### Get Furniture by ID (Public)
```http
GET /furniture/:id
```

#### Create Furniture (Admin Only)
```http
POST /furniture
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Modern Wooden Bed",
  "price": 18999,
  "mrp": 35999,
  "category": "beds",
  "description": "King size wooden bed with storage",
  "image": "/bed.png",
  "discount": 47,
  "rating": 4.7,
  "reviews": 189,
  "badge": "Sale",
  "isBestSeller": true,
  "emiText": "From ₹791/month",
  "stock": 20
}
```

#### Update Furniture (Admin Only)
```http
PUT /furniture/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "price": 19999,
  "stock": 18
}
```

#### Delete Furniture (Admin Only)
```http
DELETE /furniture/:id
Authorization: Bearer <admin-token>
```

### Cart Endpoints

#### Get User Cart
```http
GET /cart
Authorization: Bearer <token>
```

#### Add Item to Cart
```http
POST /cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "64f...",
  "quantity": 1
}
```

#### Update Cart Item Quantity
```http
PUT /cart/:productId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 2
}
```

#### Remove Item from Cart
```http
DELETE /cart/:productId
Authorization: Bearer <token>
```

#### Clear Cart
```http
POST /cart/clear
Authorization: Bearer <token>
```

### Order Endpoints

#### Create Order
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "email": "rajesh@example.com",
  "phone": "9876543210",
  "address": "123 Main Street",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001"
}
```

#### Get User Orders
```http
GET /orders
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /orders/:id
Authorization: Bearer <token>
```

#### Update Order Status (Admin Only)
```http
PUT /orders/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

**Status Options:** `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`

#### Get All Orders (Admin Only)
```http
GET /orders/admin/all?page=1&limit=20
Authorization: Bearer <admin-token>
```

### Wishlist Endpoints

#### Get Wishlist
```http
GET /wishlist
Authorization: Bearer <token>
```

#### Add Item to Wishlist
```http
POST /wishlist
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "64f..."
}
```

#### Remove from Wishlist
```http
DELETE /wishlist/:productId
Authorization: Bearer <token>
```

## 🔐 Authentication Flow

1. **Sign Up**: User creates account with email, password, first name, last name
2. **Login**: User logs in and receives JWT token
3. **Token Storage**: Frontend stores token in localStorage
4. **Authorization**: Include token in Authorization header: `Bearer <token>`
5. **Token Verification**: Backend verifies token on protected routes

## 📊 Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (only in development)"
}
```

## 🚨 HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 🔒 Role-Based Access Control

### BUYER Role
- Signup and Login
- Browse furniture
- Manage cart
- Create orders
- View own orders
- Manage wishlist

### ADMIN Role
- All buyer features
- Create furniture
- Update furniture
- Delete furniture
- View all orders
- Update order status

## 📝 Validation Rules

### User Registration
- Email: Valid email format, unique
- Password: Minimum 6 characters
- First Name: Required
- Last Name: Required

### Furniture
- Name: Required
- Price: Positive number
- MRP: Positive number
- Category: Required
- Others: Optional

### Order
- First Name, Last Name: Required
- Email: Valid email format
- Phone: At least 10 characters
- Address, City, State, Pincode: Required

## 🗂️ Project Structure

```
D-L-Furniture-Backend/
├── src/
│   ├── config/
│   │   └── db.ts              # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── furniture.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── order.controller.ts
│   │   └── wishlist.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Furniture.model.ts
│   │   ├── Cart.model.ts
│   │   ├── Order.model.ts
│   │   └── Wishlist.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── furniture.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── order.routes.ts
│   │   └── wishlist.routes.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── jwt.ts
│   │   └── response.ts
│   ├── validations/
│   │   ├── auth.validation.ts
│   │   ├── furniture.validation.ts
│   │   ├── order.validation.ts
│   ├── app.ts
│   └── server.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing the API

### Using cURL

```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Get furniture
curl http://localhost:5000/api/furniture

# Add to cart (with token)
curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "64f...",
    "quantity": 1
  }'
```

### Using Postman
1. Import the API collection
2. Set base URL: `http://localhost:5000/api`
3. For protected routes, add Authorization header with Bearer token
4. Test each endpoint

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `sudo systemctl status mongod`
- Check MONGODB_URI in .env file
- For Docker: `docker ps` to check if container is running

### JWT Token Error
- Ensure JWT_SECRET is set in .env
- Check token format in Authorization header: `Bearer <token>`
- Verify token hasn't expired (7 days default)

### CORS Error
- CORS is enabled by default
- If needed, modify cors() in server.ts

## 📚 Frontend Integration

The frontend (D-L-Furniture) is built with Next.js and communicates with this backend API. Ensure:

1. Backend is running on `http://localhost:5000`
2. Frontend API calls match the endpoints documented above
3. JWT tokens are properly stored and sent in request headers
4. Cart and Wishlist data are persisted via backend API

## 📄 License

ISC

## 👨‍💼 Author

D&L Furniture Team

---

**Last Updated**: January 17, 2024
**Status**: Production Ready ✅
