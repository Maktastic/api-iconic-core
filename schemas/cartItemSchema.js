import mongoose from "mongoose";

const cartItemsSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    cartID: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 24 hours
    },
    productID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    total_price: {
        type: Number,
        default: 0,
        required: true
    },
    userAmount: {
        type: Number
    },
    purchaseType: {
        type: String,
        enum: ['fullMiner', 'partialMiner', 'container'],
        required: true
    },
    sharePercentage: {
        type: Number
    },
    EOI: {
        type: Number
    },
    currency: {
        type: String,
        default: 'USD'
    }
});

const CartItem = mongoose.model('Cart-Items', cartItemsSchema);
export default CartItem;
