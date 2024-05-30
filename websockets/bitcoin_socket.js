import dotenv from "dotenv";
dotenv.config()
import { Server } from "socket.io";
import jwt from 'jsonwebtoken';
import axios from "axios";
import Logbook from "../config/logger.js";

export default function createBitcoinWebsocket(server, express_server) {
    const io = new Server(server, {
        cors: {
            origin: { path: [process.env.SERVER_PATH] }
        }
    });

    // Middleware for JWT authentication
    const authenticateSocket = (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        jwt.verify(token, process.env.ACCOUNT_SECRET_KEY, (err, decoded) => {
            if (err) {
                return next(new Error('Authentication error'));
            }

            socket.decoded = decoded._id;
            next();
        });
    };

    io.use(authenticateSocket).on('connection', (socket) => {
        // Fetch Bitcoin price and emit to the client every 5 seconds
        const fetchBitcoinPrice = async () => {
            try {
                // Fetch Bitcoin price from an API
                // const bitcoinPrice = await fetchBitcoinPriceFromAPI();
                const bitcoinPrice = Math.random() * 10000; // Dummy data for demonstration
                await axios.get(`https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/listings/latest`, {
                    headers: {
                        'X-CMC_PRO_API_KEY': 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c'
                    }
                }).then((response) => {
                    io.emit('bitcoinPriceUpdate', bitcoinPrice);

                }).catch((error) => {
                    Logbook.error(error);
                })

            } catch (error) {
                Logbook.error('Error fetching Bitcoin price:', error.message);
            }
        };

        const bitcoinPriceInterval = setInterval(fetchBitcoinPrice, 24 * 60 * 60 * 1000);

        // Handle socket disconnections
        socket.on('disconnect', () => {
            clearInterval(bitcoinPriceInterval);
            Logbook.info('Socket disconnected:');
        });

    });

    io.listen(server)
}
