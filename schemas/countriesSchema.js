import mongoose from "mongoose";
import crypto from "crypto";


const countries = new mongoose.Schema({
    name: {
        type: String
    },

    dial_code: {
        type: String
    },

    code: {
        type: String
    }

}, { "createdAt": 1 } )

const Countries = mongoose.model('countries', countries)
export default Countries