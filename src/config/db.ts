import mongoose from "mongoose";

let isConnected = false;

const connectDB = async (): Promise<void> => {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("❌ MONGODB_URI is required");
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", (error as Error).message);
    throw error; // 🔥 MUST throw
  }
};

export default connectDB;
