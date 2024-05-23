import express from "express";
import passportConfig from "../config/passport.js";

const routes = express.Router()
const isDev = process.env.NODE_ENV !== 'production'
const basePath = isDev ? 'dev' : 'prod'

// Controllers
import accountController from "../controllers/accountController.js";

//Validations
import validateLogin from "../validations/validateLogin.js";
import validateRegister from "../validations/validateRegister.js";
import passport from "passport";

// Non-Authenticated Routes
routes.post('/register', validateRegister, accountController.register)
routes.post('/login', validateLogin, accountController.login)

// Authenticated Routes

// ---------------- Secure Google Authentication ---------------
routes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] } ));

routes.get('/google/callback', passport.authenticate('google', 
    { failureRedirect: `${process.env.BASE_PATH}/login?google-auth-failure&status=400` }), 
    accountController.googleSuccess);

// ---------------- Secure Google Authentication ---------------

// ---------------- GET USER DATA -----------------------

routes.post('/user/:id', accountController.getUser)

routes.get('/protected', passport.authenticate('jwt', { session: false }),(req, res) => {
    res.status(200).send({ message: "accessed a protected route" })
})

export default routes