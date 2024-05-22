import mongoose from "mongoose";
import dotenv from "dotenv";
import Logbook from "../config/logger.js";
dotenv.config()

const MONGODBURI = process.env.NODE_ENV !== 'production' ? process.env.MONGODB_URI : null

if(!MONGODBURI) {
    Logbook.error('MONGODB URI IS MISSING')
    throw new Error('MONGODB URI IS MISSING')
}



// Connect to MongoDB
export const connectDatabase = async () => {
    let retries = 5; // Number of connection retries
    console.log(MONGODBURI)
    while (retries) {
        try {
            const options = {
                dbName: process.env.NODE_ENV !== 'development' ? process.env.MONGODB_PROD_DBNAME : process.env.MONGODB_DEV_DBNAME
            };

            const connection = await mongoose.connect(MONGODBURI, options);
            Logbook.error(`MongoDB Connected: ${connection.connection.host}`)

            return connection;
        } catch (error) {
            Logbook.error('MongoDB Connection Error:', error.message)
            retries--;
            Logbook.error(`Retrying connection... (${retries} retries left)`)
            // Wait for some time before retrying
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
        }
    }
    // If all retries fail, exit the process
    Logbook.error('Failed to connect to MongoDB after retries, exiting...')
    process.exit(1);
};

mongoose.connection.on('disconnected', async () => {
    Logbook.error('Reconnecting')
    await connectDatabase()
})

mongoose.connection.on('error', async(error) => {
    Logbook.error('MongoDB Connection Error: ', error)
    return error
})

// Export the Mongoose connection
export default connectDatabase
