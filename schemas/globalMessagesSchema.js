import mongoose from "mongoose";


const globalMessagesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
})

const GlobalMessages = mongoose.model('Global-Messages', globalMessagesSchema);

export default GlobalMessages