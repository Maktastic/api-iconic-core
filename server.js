import dotenv from "dotenv";
dotenv.config()
import express from 'express'
import routes from './routes/index.js'
import morgan from 'morgan'
import helmet from "helmet";
import bodyParser from "body-parser";
import databaseConnect from "./utils/databaseConnect.js";
import cookieParser from "cookie-parser";
import redisSession from "./config/redis.js";
import passport from "passport";
import passportConfig from "./config/passport.js";


const isDev = process.env.NODE_ENV !== 'production'
const basePath = isDev ? 'dev' : 'prod'


async function serverInit() {
    await databaseConnect()
    const app = express()

    // Middlewares
    if(isDev) app.use(morgan('dev'))
    if(!isDev) app.use(helmet())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }));
    app.use(redisSession);

    // Passport middleware
    passportConfig()
    app.use(passport.initialize());
    app.use(passport.session());
    
    
    // Routes 
    try {
        app.use(`/api/${basePath}`, routes)
    } catch(e) {
        console.error('Base Path is missing')
        throw new Error('Base Path is missing')
    }
    
    // Server Listener
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
        console.log(`Server Started on PORT ${PORT}`)
    })
}

serverInit()
