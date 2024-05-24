import dotenv from "dotenv";
dotenv.config()
import express from 'express'
import routes from './routes/index.js'
import morgan from 'morgan'
import helmet from "helmet";
import databaseConnect from "./utils/databaseConnect.js";
import redisSession from "./config/redis.js";
import passport from "passport";
import passportConfig from "./config/passport.js";
import Logbook from "./config/logger.js";
import { createServer } from "http";
import createBitcoinWebsocket from "./websockets/bitcoin_socket.js";
import cors from 'cors';
import * as http from "node:http";
import {Server} from "socket.io";
import * as path from "node:path";
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV !== 'production'
const basePath = isDev ? 'dev' : 'prod'

async function serverInit() {
    await databaseConnect()
    const app = express()

    // Middlewares
    app.use(express.static(path.join(__dirname, "public")))
    if(isDev) app.use(morgan('dev'))
    if(!isDev) app.use(helmet())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }));
    // app.use(cors()); // Use the CORS middleware
    app.use(redisSession);

    // Passport middleware
    passportConfig()
    app.use(passport.session());

    // Routes 
    try {
        app.use(`/api/${basePath}`, routes)
    } catch(e) {
        Logbook.error('Base Path is missing')
        throw new Error('Base Path is missing')
    }

    // Server Listener
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
        console.log(`Server Started on PORT ${PORT}`)
    })
}

serverInit()
