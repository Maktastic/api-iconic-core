import mongoose from "mongoose";
import chargesSchema from "./chargesSchema.js";

const buyMiner = new mongoose.Schema({
    expected_price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    EOI: {
        type: Number,
        required: true
    },

    type: {
        type: String,
        default: 'buyMiner'
    },

    charges: [chargesSchema]


}, { timestamps: true })

const BuyMiner = mongoose.model('BuyMiner', buyMiner)
export default BuyMiner