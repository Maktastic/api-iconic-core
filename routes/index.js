import express from "express";
import accountController from "../controllers/accountController.js";
const routes = express.Router()

// Non-Authenticated Routes
routes.post('/register', accountController.register)

// Authenticated Routes

export default routes