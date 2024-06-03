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
    isAdmin: {
      type: Boolean,
      default: false  
    },
    adminLevel: {
        type: Number,
        default: 0
    },
    surname: {
        type: String,
    },
    mobile_number: {
        type: Number
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
    twoFactorAuthSecret: {
      type: String  
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
       default: 0
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
    },
    resetCode: {
        type: Number
    },
    resetExpiry: {
        type: Number
    },
    documents: {
        passport: {
            fileName: { type: String, default: null },
            pathUrl: { type: String, default: null },
            status: { type: String, default: 'pending' }
        },
        id: {
            fileName: { type: String, default: null },
            pathUrl: { type: String, default: null },
            status: { type: String, default: 'pending' }
        },
        kyc: {
            fileName: { type: String, default: null },
            pathUrl: { type: String, default: null },
            status: { type: String, default: 'pending' }
        },
        utility_bills: {
            fileName: { type: String, default: null },
            pathUrl: { type: String, default: null },
            status: { type: String, default: 'pending' }
        }
    }

})

// Create Indexes
account.index({ email: 1 }, { unique: true, sparse: true });
account.index({ customerID: 1 }, { unique: true })

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