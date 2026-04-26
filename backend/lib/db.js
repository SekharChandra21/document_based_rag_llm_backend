import mongoose from 'mongoose';

export const connectDB = async () =>{
    try {
        console.log('📝 Mongo URI:', process.env.MONGO_URI ? '***' + process.env.MONGO_URI.slice(-20) : 'NOT SET');
        console.log('📝 Mongo DB Name option:', process.env.MONGO_DB_NAME);

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.MONGO_DB_NAME || undefined,
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            connectTimeoutMS: 5000
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        console.log(`✅ Connected database: ${conn.connection.name}`);
        return conn;

    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        console.error(`⚠️  Will continue startup in degraded mode`);
        // Don't exit - let the error propagate to server.js for graceful handling
        throw error;
    }
}
