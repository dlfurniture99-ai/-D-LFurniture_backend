# Sample Product Data

This directory contains sample product data for manual database insertion.

## Files

- `products.json` - Product data in JSON format
- `insert-products.js` - MongoDB insert script

## How to Insert Data

### Method 1: Using MongoDB Compass (GUI)

1. Open **MongoDB Compass**
2. Connect to your MongoDB instance
3. Select database: `furniture-store`
4. Select collection: `products`
5. Click **ADD DATA** → **Import JSON**
6. Select `products.json`
7. Click **Import**

### Method 2: Using mongosh (CLI)

```bash
# Navigate to this directory
cd backend/sample-data

# Run the insert script
mongosh < insert-products.js
```

### Method 3: Direct mongosh Insert

```bash
mongosh

use furniture-store

db.products.insertMany([
  {
    "productName": "Modern 3-Seater Sofa",
    "productImage": ["url1", "url2", "url3"],
    "productPrice": "45000",
    "productDiscount": 15,
    "productDescription": "Description here",
    "productReview": 4.5,
    "productType": "sofas"
  }
  // ... more products
])
```

## Product Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productName | String | ✅ | Name of the product |
| productImage | Array[String] | ✅ | Array of image URLs (minimum 1) |
| productPrice | String | ✅ | Price in rupees |
| productDiscount | Number | ❌ | Discount percentage (0-100) |
| productDescription | String | ✅ | Product description |
| productReview | Number | ❌ | Rating (0-5) |
| productType | String | ✅ | Category: sofas, beds, dining, office, storage, outdoor, decor |

## Example Product Payload

```json
{
  "productName": "Modern 3-Seater Sofa",
  "productImage": [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
    "https://images.unsplash.com/photo-1517457373614-b7152f800fd1"
  ],
  "productPrice": "45000",
  "productDiscount": 15,
  "productDescription": "Comfortable 3-seater sofa with premium fabric upholstery",
  "productReview": 4.5,
  "productType": "sofas"
}
```

## Verify Data

After insertion, verify in mongosh:

```bash
mongosh

use furniture-store

# View all products
db.products.find()

# Count products
db.products.countDocuments()

# Find by type
db.products.find({productType: "sofas"})
```

## Notes

- `productId` is auto-generated with UUID
- Timestamps are auto-added by MongoDB
- Ensure MongoDB is running before inserting data
- Use valid image URLs from CDN or your server
