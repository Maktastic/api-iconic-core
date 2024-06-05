import mongoose from "mongoose";


const chargesSchema = new mongoose.Schema({
    title: {
        type: String
    },

    price: {
        type: Number
    }
})

export default chargesSchema