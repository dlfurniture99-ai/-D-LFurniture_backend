import mongoose, { Connection } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
    uri: string;
    retryAttempts: number;
    retryDelay: number;
}

const config: DatabaseConfig = {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/furniture-store',
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '5000', 10),
};

let isConnected: boolean = false;

export default async function connectDatabase(): Promise<Connection | null> {
    if (isConnected) {
        console.log('✅ Using existing database connection');
        return mongoose.connection;
    }

    let attempts = 0;

    while (attempts < config.retryAttempts) {
        try {
            await mongoose.connect(process.env.MONGODB_URI || "", {
                dbName: "dandldb",
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                retryWrites: true,
                w: 'majority',
            });

            isConnected = true;
            console.log('✅ MongoDB connected successfully');
            console.log(`📊 Database: ${mongoose.connection.name}`);
            console.log(`🏠 Host: ${mongoose.connection.host}`);
            
            return mongoose.connection;
        } catch (err: any) {
            attempts++;

            if (attempts < config.retryAttempts) {
                console.log(`⏳ Retrying in ${config.retryDelay / 1000} seconds...`);
                await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
            }
        }
    }

    const errorMsg = `Failed to connect to MongoDB after ${config.retryAttempts} attempts`;
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
}

export async function disconnectDatabase(): Promise<void> {
    try {
        if (isConnected) {
            await mongoose.disconnect();
            isConnected = false;
            console.log('✅ MongoDB disconnected');
        }
    } catch (err: any) {
        console.error('❌ Error disconnecting from MongoDB:', err.message);
        throw err;
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n⚠️  SIGINT received, closing database connection...');
    await disconnectDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️  SIGTERM received, closing database connection...');
    await disconnectDatabase();
    process.exit(0);
});