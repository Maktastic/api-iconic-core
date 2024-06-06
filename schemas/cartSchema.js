import mongoose from "mongoose";
import crypto from "crypto";

const cartSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CartItem',
        required: true
    }],
    cartID: {
        type: String,
        default: () => crypto.randomInt(100000, 999999).toString(),
        unique: true // Ensuring cartID is unique
    },
    currency: {
        type: String,
        default: 'USD'
    },
    total_EOI: {
        type: Number,
        default: 0,
        required: true
    },
    grand_total: {
        type: Number,
        default: 0,
        required: true
    },
    total_quantity: {
        type: Number,
        required: true,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 24 hours
    }
});

cartSchema.index({ cartID: 1 }, { unique: true });

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
