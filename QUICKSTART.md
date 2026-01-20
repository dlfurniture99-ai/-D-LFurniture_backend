# 🚀 Quick Start Guide - D&L Furniture Backend

## 5-Minute Setup

### Step 1: Install & Start
```bash
# Navigate to backend folder
cd D-L-Furniture-Backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start MongoDB (if not running)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start dev server
npm run dev
```

Your backend is now running at: **http://localhost:5000**

---

## 🧪 Test the API (Using cURL)

### 1. Create Account (Sign Up)
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "buyer"
    }
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Save the token from response for next steps**

### 3. Get All Furniture
```bash
curl "http://localhost:5000/api/furniture?page=1&limit=20"
```

### 4. Get Specific Product
```bash
curl "http://localhost:5000/api/furniture/[product-id]"
```

### 5. Add to Cart (with your token)
```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer [your-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "[product-id]",
    "quantity": 1
  }'
```

### 6. Get Cart
```bash
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer [your-token]"
```

### 7. Checkout (Create Order)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer [your-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "address": "123 Main Street",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  }'
```

### 8. View Your Orders
```bash
curl http://localhost:5000/api/orders \
  -H "Authorization: Bearer [your-token]"
```

### 9. Add to Wishlist
```bash
curl -X POST http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer [your-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "[product-id]"
  }'
```

### 10. Get Wishlist
```bash
curl http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer [your-token]"
```

---

## 👨‍💼 Admin Operations

### Create Admin Account (Manual)

1. Sign up as regular user
2. Modify in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "admin@example.com" },
     { $set: { role: "admin" } }
   )
   ```

3. Login to get admin token

### Admin: Create Product
```bash
curl -X POST http://localhost:5000/api/furniture \
  -H "Authorization: Bearer [admin-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Modern Wooden Sofa",
    "price": 24999,
    "mrp": 49999,
    "category": "sofas",
    "description": "Premium solid wood sofa set",
    "image": "/sofa.png",
    "discount": 50,
    "rating": 4.5,
    "reviews": 100,
    "stock": 20,
    "isBestSeller": true
  }'
```

### Admin: Update Product
```bash
curl -X PUT http://localhost:5000/api/furniture/[product-id] \
  -H "Authorization: Bearer [admin-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 22999,
    "stock": 18
  }'
```

### Admin: Delete Product
```bash
curl -X DELETE http://localhost:5000/api/furniture/[product-id] \
  -H "Authorization: Bearer [admin-token]"
```

### Admin: Update Order Status
```bash
curl -X PUT http://localhost:5000/api/orders/[order-id]/status \
  -H "Authorization: Bearer [admin-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SHIPPED"
  }'
```

### Admin: View All Orders
```bash
curl "http://localhost:5000/api/orders/admin/all?page=1&limit=20" \
  -H "Authorization: Bearer [admin-token]"
```

---

## 🔍 Advanced Search & Filtering

### Search by Name
```bash
curl "http://localhost:5000/api/furniture?search=sofa"
```

### Filter by Category
```bash
curl "http://localhost:5000/api/furniture?category=sofas"
```

### Filter by Price Range
```bash
curl "http://localhost:5000/api/furniture?minPrice=10000&maxPrice=30000"
```

### Sort by Price (Low to High)
```bash
curl "http://localhost:5000/api/furniture?sortBy=price"
```

### Sort by Best Sellers
```bash
curl "http://localhost:5000/api/furniture?sortBy=bestsellers"
```

### Pagination
```bash
# Get page 2, 25 items per page
curl "http://localhost:5000/api/furniture?page=2&limit=25"
```

### Combine Filters
```bash
curl "http://localhost:5000/api/furniture?category=sofas&minPrice=15000&maxPrice=40000&sortBy=price&page=1&limit=20"
```

---

## 📱 Using Postman

### Import Collection
1. Open Postman
2. Create new collection "D&L Furniture API"
3. Add requests from this structure:

```
D&L Furniture API
├── Auth
│   ├── Sign Up
│   ├── Login
│   └── Get Current User
├── Furniture
│   ├── Get All (with filters)
│   ├── Get By ID
│   ├── Create (Admin)
│   ├── Update (Admin)
│   └── Delete (Admin)
├── Cart
│   ├── Get Cart
│   ├── Add Item
│   ├── Update Quantity
│   ├── Remove Item
│   └── Clear Cart
├── Orders
│   ├── Create Order
│   ├── Get My Orders
│   ├── Get Order Details
│   ├── Update Status (Admin)
│   └── Get All Orders (Admin)
└── Wishlist
    ├── Get Wishlist
    ├── Add Item
    └── Remove Item
```

### Set Variables in Postman
```
base_url = http://localhost:5000/api
token = [your-jwt-token]
product_id = [product-id-from-test]
order_id = [order-id-from-test]
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Restart MongoDB
docker stop mongodb
docker start mongodb
```

### Token Expired
- Login again to get a new token
- Default expiry: 7 days
- Tokens valid for 7 days from creation

### Invalid Credentials
- Double-check email and password
- Passwords are case-sensitive
- Email must match exactly

---

## 📊 Example Request Flow

### Buyer Journey
1. **Sign Up** → Get token
2. **Browse** → Get products with filters
3. **View** → Get product details
4. **Add to Cart** → Add items
5. **Add to Wishlist** → Save favorites
6. **Checkout** → Create order
7. **Track** → Check order status

### Admin Journey
1. **Sign Up** → Get token
2. **Update Role** → Change to admin (MongoDB)
3. **Create** → Add new products
4. **Update** → Modify product details
5. **Delete** → Remove products
6. **Track** → View all orders
7. **Update Status** → Ship/deliver orders

---

## 🔐 Token Information

### Structure
```
Header.Payload.Signature
```

### Payload Contains
```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "role": "buyer" | "admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### How to Decode (for testing)
- Copy token
- Visit jwt.io
- Paste token in "Encoded" box
- See payload in "Decoded" box

---

## 🚀 Next Steps

1. **Connect Frontend**
   - Update API base URL in frontend
   - Set up token storage
   - Test each page

2. **Add Real Products**
   - Create admin account
   - Add furniture via API
   - Upload images

3. **Configure Email**
   - Setup email service
   - Send order confirmations
   - Send shipping updates

4. **Setup Payment**
   - Integrate Razorpay
   - Handle payment verification
   - Update order status

5. **Deploy**
   - Build frontend
   - Deploy backend to server
   - Configure production environment

---

## 📞 Quick Reference

| Operation | Endpoint | Method | Auth |
|-----------|----------|--------|------|
| Sign Up | `/auth/signup` | POST | ❌ |
| Login | `/auth/login` | POST | ❌ |
| Get Products | `/furniture` | GET | ❌ |
| Get Product | `/furniture/:id` | GET | ❌ |
| Create Product | `/furniture` | POST | ✅ Admin |
| Update Product | `/furniture/:id` | PUT | ✅ Admin |
| Delete Product | `/furniture/:id` | DELETE | ✅ Admin |
| Get Cart | `/cart` | GET | ✅ |
| Add to Cart | `/cart` | POST | ✅ |
| Update Cart | `/cart/:id` | PUT | ✅ |
| Remove from Cart | `/cart/:id` | DELETE | ✅ |
| Clear Cart | `/cart/clear` | POST | ✅ |
| Create Order | `/orders` | POST | ✅ |
| Get My Orders | `/orders` | GET | ✅ |
| Get Order | `/orders/:id` | GET | ✅ |
| Update Status | `/orders/:id/status` | PUT | ✅ Admin |
| Get All Orders | `/orders/admin/all` | GET | ✅ Admin |
| Get Wishlist | `/wishlist` | GET | ✅ |
| Add to Wishlist | `/wishlist` | POST | ✅ |
| Remove from Wishlist | `/wishlist/:id` | DELETE | ✅ |

---

**Happy coding! 🎉**

For detailed documentation, see [README.md](./README.md)
