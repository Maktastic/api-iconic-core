import dotenv from 'dotenv'
dotenv.config()
import redis from 'redis'
import session from 'express-session'
import RedisStore from "connect-redis";


const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
})

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (error) => {
    console.log('Redis error: ', error);
    throw new Error('Redis Client Error')
})

await redisClient.connect();

const redisSession = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.ACCOUNT_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set secure to true if using HTTPS
})

export default redisSession