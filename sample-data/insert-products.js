// MongoDB Insert Script
// Usage: mongosh < insert-products.js
// Or use MongoDB Compass to import the JSON file

// Connect to database
use('furniture-store');

// Sample products data
const products = [
  {
    productName: "Modern 3-Seater Sofa",
    productImage: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
      "https://images.unsplash.com/photo-1517457373614-b7152f800fd1",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14"
    ],
    productPrice: "45000",
    productDiscount: 15,
    productDescription: "Comfortable 3-seater sofa with premium fabric upholstery. Perfect for modern living rooms with elegant grey color and wooden legs.",
    productReview: 4.5,
    productType: "sofas"
  },
  {
    productName: "Queen Size Bed Frame",
    productImage: [
      "https://images.unsplash.com/photo-1540932014986-30128078891c",
      "https://images.unsplash.com/photo-1510672981848-a1aa3070f2c4",
      "https://images.unsplash.com/photo-1516728267335-a3895b3d3fe9"
    ],
    productPrice: "35000",
    productDiscount: 20,
    productDescription: "Solid wood queen size bed frame with storage drawers. Crafted from premium teak wood with traditional Indian design and durability.",
    productReview: 4.7,
    productType: "beds"
  },
  {
    productName: "Dining Table Set (6 Seater)",
    productImage: [
      "https://images.unsplash.com/photo-1551632786-de41ec56a975",
      "https://images.unsplash.com/photo-1577140917170-285929fb55b7",
      "https://images.unsplash.com/photo-1562030160-5d8ab54c5f78"
    ],
    productPrice: "55000",
    productDiscount: 10,
    productDescription: "Elegant 6-seater dining set with solid wood table and matching chairs. Features beautiful grain patterns and comfortable seating.",
    productReview: 4.6,
    productType: "dining"
  },
  {
    productName: "Office Executive Chair",
    productImage: [
      "https://images.unsplash.com/photo-1592078615290-033ee584e267",
      "https://images.unsplash.com/photo-1565182999555-2e2de9f3e292",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b3f7"
    ],
    productPrice: "12000",
    productDiscount: 25,
    productDescription: "Premium executive office chair with ergonomic design. Supports up to 120kg with adjustable height and lumbar support.",
    productReview: 4.4,
    productType: "office"
  },
  {
    productName: "Wooden Storage Cabinet",
    productImage: [
      "https://images.unsplash.com/photo-1548375341-c4bf5ec42e8f",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
      "https://images.unsplash.com/photo-1539930881899-6da20f279e51"
    ],
    productPrice: "18000",
    productDiscount: 12,
    productDescription: "Spacious wooden storage cabinet with multiple shelves and compartments. Perfect for living room or bedroom organization.",
    productReview: 4.3,
    productType: "storage"
  }
];

// Insert products
const result = db.products.insertMany(products);

// Print results
console.log(`✅ Inserted ${result.insertedIds.length} products successfully!`);
console.log('Inserted IDs:', result.insertedIds);
