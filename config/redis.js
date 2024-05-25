import dotenv from 'dotenv'
dotenv.config()
import redis from 'redis'
import session from 'express-session'
import RedisStore from "connect-redis";


const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
})

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis DB'));
redisClient.on('ready', () => console.log('Ready to use Redis DB'));
redisClient.on('end', () => console.log('Client disconnected from Redis DB'));

(async () => {
    await redisClient.connect();
    // isOpen will return True here as the client's socket is open now.
    // isReady will return True here, client is ready to use.
    console.log(`client.isOpen: ${redisClient.isOpen}, client.isReady: ${redisClient.isReady}`);
})();

process.on('SIGINT', async () => {
    await redisClient.disconnect();
    process.exit(0)
});

const redisSession = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.ACCOUNT_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set secure to true if using HTTPS
})

export default redisSession