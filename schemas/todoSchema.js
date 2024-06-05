import mongoose from "mongoose";


const todoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: false
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    }
}, { _id: true, timestamps: true })

const TODO = mongoose.model('todo_list', todoSchema)

export default TODO