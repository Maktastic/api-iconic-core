import dotenv from "dotenv";
dotenv.config()
import express from 'express'
import routes from './routes/index.js'
import morgan from 'morgan'
import helmet from "helmet";
import bodyParser from "body-parser";

const isDev = process.env.NODE_ENV !== 'production'

const app = express()
// Middlewares
if(isDev) app.use(morgan('dev'))
app.use(helmet())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false}))

app.use('/api/', routes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server Started on PORT ${PORT}`)
})