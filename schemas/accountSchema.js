import mongoose from "mongoose";
import bcrypt from "bcrypt";

const account = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    mobile_number: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true,
        sparse: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})

account.pre('save', (next) => {
    if (!this.isModified || !this.isModified('password')) {
        return next();
    }

    return new Promise(async (resolve, reject) => {
        const salt = await bcrypt.genSalt(12)
        const ACCOUNT_SECRET_KEY = process.env.ACCOUNT_SECRET_KEY
        this.password = await bcrypt.hash(this.password + ACCOUNT_SECRET_KEY, salt)
        next()
        resolve(true)
    }).catch((error) => {
        next(error)
    })
})

const Account = mongoose.model('Account', account)
export default Account