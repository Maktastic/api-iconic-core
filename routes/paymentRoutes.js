import express from "express";
import passport from "passport";

// Controllers
import paymentController from "../controllers/payments/paymentController.js";

const paymentRoutes = express.Router()
const AuthenticateAPI = passport.authenticate('jwt', { session: false })

paymentRoutes.post('/checkout', AuthenticateAPI, paymentController.createCheckoutSession)


export default paymentRoutes