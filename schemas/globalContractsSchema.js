import mongoose from "mongoose";


const globalContractsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    fileName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
})

const GlobalContracts = new mongoose.model('Global-Contracts', globalContractsSchema)
export default GlobalContracts