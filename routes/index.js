import express from "express";
import passportConfig from "../config/passport.js";

const routes = express.Router()

// Controllers
import accountController from "../controllers/accountController.js";

//Validations
import validateLogin from "../validations/validateLogin.js";
import validateRegister from "../validations/validateRegister.js";

// Non-Authenticated Routes
routes.post('/register', validateRegister, accountController.register)
routes.post('/login', validateLogin, accountController.login)

// Authenticated Routes

routes.get('/protected', passportConfig, (req, res) => {
    res.status(200).send({ message: "accessed a protected route" })
})

export default routes