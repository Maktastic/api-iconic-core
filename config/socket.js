import dotenv from 'dotenv'
dotenv.config()
import { Server } from 'socket.io'
import axios from "axios";
import jwt from "jsonwebtoken";
import Logbook from "./logger.js";

async function getBitcoinPrice() {
    const response = await axios.get('https://api.coindesk.com/v1/bpi/currentprice/BTC.json');
    if(response) {
        return parseFloat(response.data?.bpi?.USD?.rate_float).toFixed(2) 
    } else {
        Logbook.error('Failed to fetch data')
        return 0
    }
}

export default function createBitcoinSocket(server) {
    // const httpServer = new createServer(server)
    const io = new Server(server, {
        cors: {
            path: 'http://localhost:5000'
        }
    });
    
    const passportAuthetication = (socket, next) => {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(socket.handshake.query.token, process.env.ACCOUNT_SECRET_KEY, (err, decoded) => {
                if (err) {
                    Logbook.error(err)
                    return next(new Error('Authentication error'));
                }
                socket.decoded = decoded;
                next();
            });
        } else {
            Logbook.error('Authentication Error')
            next(new Error('Authentication error'));
        }
    }
    
    
    io.use(passportAuthetication).on('connection', async socket => {

        Logbook.info(`Connected User: ${socket.id}`);
        
        const bitcoinPriceUpdate =  async () => {
            try {
                const response = await getBitcoinPrice()
                if(response) {
                    socket.emit('bitcoinPriceUpdate', response)
                }
            } catch (e) {
                Logbook.error('Error fetching Bitcoin price:', e);
                return null;
            }
        }

        // Send Bitcoin price every 10 seconds
        const intervalId = setInterval(bitcoinPriceUpdate, 20000);

        // Clear interval on disconnect
        socket.on('disconnect', () => {
            Logbook.error('user disconnected');
            clearInterval(intervalId);
        });
    })
    
}