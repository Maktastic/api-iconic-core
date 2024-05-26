import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config()

export function generateToken({ _id }) {
    if(!_id) return null;
    return jwt.sign({ _id }, process.env.ACCOUNT_SECRET_KEY, { expiresIn: '24h' });
}

export function generateRefreshToken({ _id }) {
    if(!_id) return null
    return jwt.sign({_id}, process.env.ACCOUNT_REFRESH_TOKEN, { expiresIn: '7d'})
}

export function generateTemporaryToken({ _id }) {
    if(!_id) return null
    return jwt.sign({_id}, process.env.ACCOUNT_SECRET_KEY, { expiresIn: '10m' })
}