import mongoose from 'mongoose';

export const connectDB = async () =>{
    try {
        console.log('Mongo URI:', process.env.MONGO_URI);
        console.log('Mongo DB Name option:', process.env.MONGO_DB_NAME);

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.MONGO_DB_NAME || undefined
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
        console.log(`Connected database: ${conn.connection.name}`);

    } catch (error) {
        console.error(`Error at backend: ${error.message}`);
        process.exit(1);
    }
}
