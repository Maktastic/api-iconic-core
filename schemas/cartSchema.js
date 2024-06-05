import mongoose from "mongoose";
import crypto from "crypto";


const cart = new mongoose.Schema({

    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
    },

    quantity: {
        type: Number,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    // Buy Miner, Container, Shared Mining
    purchaseType: {
        type: String
    },

    buyMinerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BuyMiner',
    },

    buyMinerData: {
        type: Object
    },

    cartID: {
        type: Number,
        default: crypto.randomInt(100000, 999999).toString()
    },

    price: {
        type: Number,
        default: 0,
        required: true
    },

    currency: {
        type: String,
        default: 'USD',
    },

    minerDescription: {
        type: String
    }

}, { "createdAt": 1 }, { expireAfterSeconds: 86400 } )

cart.index({ cartID: 1 }, { unique: true })

const Cart = mongoose.model('Cart', cart)
export default Cart