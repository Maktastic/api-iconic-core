import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config()

const MONGODBURI = process.env.NODE_ENV !== 'production' ? process.env.MONGODB_URI : null

if(!MONGODBURI) {
    throw new Error('MONGODB URI IS MISSING')
}

// Connect to MongoDB
export const connectDatabase = async () => {
    let retries = 5; // Number of connection retries
    while (retries) {
        try {
            const options = {
                dbName: process.env.NODE_ENV !== 'development' ? process.env.MONGODB_PROD_DBNAME : process.env.MONGODB_DEV_DBNAME,
                bufferCommands: false,
                maxIdleTimeMS: 10000,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 20000
            };

            const connection = await mongoose.connect(MONGODBURI, options);
            console.log(`MongoDB Connected: ${connection.connection.host}`);

            return connection;
        } catch (error) {
            console.error('MongoDB Connection Error:', error.message);
            retries--;
            console.log(`Retrying connection... (${retries} retries left)`);
            // Wait for some time before retrying
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
        }
    }
    // If all retries fail, exit the process
    console.error('Failed to connect to MongoDB after retries, exiting...');
    process.exit(1);
};

mongoose.connection.on('disconnected', async () => {
    console.log('Reconnecting')
    await connectDatabase()
})

mongoose.connection.on('error', async(error) => {
    console.log('MongoDB Connection Error: ', error)
    return error
})

// Export the Mongoose connection
export default connectDatabase
