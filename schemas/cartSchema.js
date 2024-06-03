import mongoose from "mongoose";
import crypto from "crypto";


const cart = new mongoose.Schema({

    userID: {
        type: String,
        unique: true
    },

    quantity: {
        type: Number,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    cartID: {
        type: Number,
        default: crypto.randomInt(100000, 999999).toString()
    },

    minerPrice: {
        type: Number,
        default: 0
    },

    minerCurrency: {
        type: String,
        default: 'USD'
    },

    contractName: {
        type: String,
        required: true
    },

    minerDescription: {
        type: String
    }

}, { "createdAt": 1 }, { expireAfterSeconds: 86400 } )