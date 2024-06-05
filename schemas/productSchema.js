import mongoose from "mongoose";
import chargesSchema from "./chargesSchema.js";

const product = new mongoose.Schema({
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
    },

    charges: [chargesSchema]


}, { timestamps: true })

const Product = mongoose.model('Product', product)
export default Product