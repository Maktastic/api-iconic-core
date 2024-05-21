import dotenv from 'dotenv'
dotenv.config()
import RedisStore from "connect-redis";
import redis from 'redis'
import session from 'express-session'

const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379
})

redisClient.on('error', (error) => {
    console.log('Redis error: ', error);
    throw new Error('Redis Client Error')
})

const redisSession = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.ACCOUNT_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set secure to true if using HTTPS
})

export default redisSession