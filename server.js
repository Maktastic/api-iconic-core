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
import cors from 'cors';
import * as path from "node:path";
import { fileURLToPath } from 'url'
import createBitcoinSocket from "./config/socket.js";
import compression from "compression";
import {invokePhoneCode} from "./serverless/sendPhoneCode.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV !== 'production'
const basePath = isDev ? 'dev' : 'prod'

async function serverInit() {
    await databaseConnect()
    const app = express()

    // Middlewares
    app.use(compression())
    app.use(express.static(path.join(__dirname, "public")))
    if(isDev) app.use(morgan('dev'))
    if(!isDev) app.use(helmet())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }));
    app.use(cors()); // Use the CORS middleware
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

    // invokePhoneCode('+971556367628')

    app.use((err, req, res, next) => {
        Logbook.error(err.stack); // Log the error stack for debugging

        // Customize the error response
        res.status(err.status || 500).send({ 
            error: {
                message: err.message,
                status: err.status || 500
            }
        });
    });

    // Handle 404 - Resource Not Found
    app.use((req, res, next) => {
        res.status(404).json({
            error: {
                message: 'Resource not found',
                status: 404
            }
        });
    });

    // Server Listener
    const PORT = process.env.PORT || 5000
    const server = app.listen(PORT, () => {
        Logbook.info(`Server Started on PORT ${PORT}`)
    })
    
    createBitcoinSocket(server)
}

serverInit()
