import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Logbook from "../config/logger.js";

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
        required: true,
        unique: true
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

account.pre('save', async function(next) {
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
        Logbook.error(error)
        next(error)
    })
})

account.methods.comparePasswords = async function(candidatePassword) {
    try {
        const ACCOUNT_SECRET_KEY = process.env.ACCOUNT_SECRET_KEY
        candidatePassword = candidatePassword + ACCOUNT_SECRET_KEY
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        Logbook.error(error)
        throw new Error(error);
    }
};

const Account = mongoose.model('Account', account)
export default Account