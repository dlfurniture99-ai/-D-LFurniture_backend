import productModel from '../models/productModel';

const mockProducts = [
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
  },
  {
    productName: "L-Shaped Corner Sofa",
    productImage: [
      "https://images.unsplash.com/photo-1550355291-bbee04a92027",
      "https://images.unsplash.com/photo-1516623750267-47ad68b01a14",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc"
    ],
    productPrice: "65000",
    productDiscount: 18,
    productDescription: "Spacious L-shaped corner sofa with premium leather upholstery. Ideal for large living spaces with modern minimalist design.",
    productReview: 4.8,
    productType: "sofas"
  },
  {
    productName: "Double Bed with Drawers",
    productImage: [
      "https://images.unsplash.com/photo-1540932014986-30128078891c",
      "https://images.unsplash.com/photo-1516728267335-a3895b3d3fe9",
      "https://images.unsplash.com/photo-1510672981848-a1aa3070f2c4"
    ],
    productPrice: "28000",
    productDiscount: 22,
    productDescription: "Functional double bed with built-in storage drawers underneath. Made from solid wood with natural finish and comfortable design.",
    productReview: 4.5,
    productType: "beds"
  },
  {
    productName: "Wall-Mounted Bookshelf",
    productImage: [
      "https://images.unsplash.com/photo-1594838291465-13ba63c1bb50",
      "https://images.unsplash.com/photo-1580274455191-1c62238fa333",
      "https://images.unsplash.com/photo-1507842217343-583f7270bfba"
    ],
    productPrice: "8000",
    productDiscount: 30,
    productDescription: "Modern wall-mounted bookshelf with minimalist design. Perfect for displaying books and decorative items in any room.",
    productReview: 4.2,
    productType: "storage"
  },
  {
    productName: "Study Desk with Shelves",
    productImage: [
      "https://images.unsplash.com/photo-1593642532400-2682a8a6b814",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262"
    ],
    productPrice: "15000",
    productDiscount: 15,
    productDescription: "Spacious study desk with built-in shelves for storage. Features compartments for books, supplies, and a spacious work surface.",
    productReview: 4.4,
    productType: "office"
  },
  {
    productName: "Outdoor Garden Chair",
    productImage: [
      "https://images.unsplash.com/photo-1551028719-00167b16ebc5",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
      "https://images.unsplash.com/photo-1517457373614-b7152f800fd1"
    ],
    productPrice: "5000",
    productDiscount: 35,
    productDescription: "Comfortable outdoor garden chair made from weather-resistant wood. Ideal for patios and outdoor spaces.",
    productReview: 4.1,
    productType: "outdoor"
  }
];

export const seedDatabase = async (): Promise<void> => {
  try {
    const productCount = await productModel.countDocuments();
    
    if (productCount === 0) {
      await productModel.insertMany(mockProducts);
      console.log(`✅ Seeded ${mockProducts.length} products into database`);
    } else {
      console.log(`ℹ Database already contains ${productCount} products. Skipping seed.`);
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};
