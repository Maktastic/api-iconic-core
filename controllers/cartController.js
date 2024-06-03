import connectDatabase from "../utils/databaseConnect.js";
import mongoose from "mongoose";


const cartController = {

    createCart: async ( req, res ) => {

        const { quantity, minerPrice, minerCurrency, contractName, minerDescription } = req.body

        const collection = await mongoose.connection.collection('carts')

        await collection.insertOne({ quantity, minerPrice, minerCurrency, contractName, minerDescription })


    }

}

export default cartController