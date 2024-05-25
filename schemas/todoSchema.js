import mongoose from "mongoose";


const todoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, { _id: true, timestamps: true })

export default todoSchema