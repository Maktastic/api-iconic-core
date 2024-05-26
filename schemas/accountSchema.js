import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Logbook from "../config/logger.js";
import todoSchema from "./todoSchema.js";

const account = new mongoose.Schema({
    customerID: {
      type: String,
      unique: true,
      default: () => 'C' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    },
    name: {
        type: String,
    },
    role: {
        type: String,
        default: 'customer'
    },
    roleID: {
        type: Number,
        default: 1
    },
    surname: {
        type: String,
    },
    mobile_number: {
        type: Number,
        sparse: true
    },
    email: {
        type: String,
        sparse: true,
        unique: true
    },
    password: {
        type: String
    },
    googleID: {
        type: String
    },
    twoFactorAuth: {
      type: Boolean,
      default: false  
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    BTC_wallet_address: {
      type: String,
      default: ''  
    },
    last_e_bill: {
       type: Number,
       default: 0,
       sparse: true
    },
    todoList: {
      type: [todoSchema],
      default: []  
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    current_status: {
        type: String,
        default: 'Online'
    },
    contracts_started: {
        type: Number,
        default: 0
    },
    payment_history: {
        type: Number,
        default: 0
    },
    tempToken: {
        type: String
    }
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
        return error
    }
};

const Account = mongoose.model('Account', account)
export default Account