import mongoose from "mongoose";


const userContractsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    s3Url: { type: String, required: true },
    fileName: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied'],
        default: 'pending'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    createdAt: { type: Date, default: Date.now },
})

const UserContract = new mongoose.model('User-Contracts', userContractsSchema)
export default UserContract