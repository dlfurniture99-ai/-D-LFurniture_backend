import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string, { dbName: 'dandldb' });
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('bookings');
        
        const count = await collection.countDocuments();
        console.log(`Total bookings in collection 'bookings': ${count}`);
        
        const lastBooking = await collection.find().sort({ createdAt: -1 }).limit(1).toArray();
        if (lastBooking.length > 0) {
            console.log('Last booking:', JSON.stringify(lastBooking[0], null, 2));
        } else {
            console.log('No bookings found.');
        }
        
        // Also check if there's an 'orders' collection (just in case)
        const ordersCollection = db.collection('orders');
        const ordersCount = await ordersCollection.countDocuments();
        console.log(`Total documents in collection 'orders': ${ordersCount}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkBookings();
