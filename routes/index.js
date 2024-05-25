import express from "express";
import passport from "passport";

const routes = express.Router()
const isDev = process.env.NODE_ENV !== 'production'
const basePath = isDev ? 'dev' : 'prod'

// Controllers
import accountController from "../controllers/accountController.js";
import calculateController from "../controllers/calculateController.js";
import todoListController from "../controllers/todoListController.js";

//Validations
import validateLogin from "../validations/validateLogin.js";
import validateRegister from "../validations/validateRegister.js";
import validateCalculation from "../validations/validateCalculation.js";
import insertListValidation from "../validations/todoList/insertList.js";
import deleteListValidation from "../validations/todoList/deleteList.js";
import updateListValidation from "../validations/todoList/updateList.js";

// Non-Authenticated Routes
routes.post('/register', validateRegister, accountController.register)
routes.post('/login', validateLogin, accountController.login)

// Authenticated Routes

routes.post('/calculate', passport.authenticate('jwt',  { session: false }), validateCalculation, calculateController.calculate)

// ---------------- Secure Google Authentication ---------------
// routes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] } ));

// routes.get('/google/callback', passport.authenticate('google', 
//     { failureRedirect: `${process.env.BASE_PATH}/login?google-auth-failure&status=400` }), 
//     accountController.googleSuccess);
// ---------------- Secure Google Authentication ---------------

// CRUD TODO list [[[[[[[][[][[{ INSERT<, UPDATE, DELETE, GET }

routes.get('/todo/all', passport.authenticate('jwt', { session: false }), todoListController.getAllList)
routes.post('/todo/add', passport.authenticate('jwt', { session: false }), insertListValidation, todoListController.addToList)
routes.post('/todo/delete', passport.authenticate('jwt', { session: false }), deleteListValidation, todoListController.deleteList)
routes.post('/todo/update', passport.authenticate('jwt', { session: false}), updateListValidation, todoListController.updateList)


// ---------------- GET USER DATA -----------------------

routes.post('/user/:id', accountController.getUser)

// routes.get('/protected', passport.authenticate('jwt', { session: false }),(req, res) => {
//     res.status(200).send({ message: "accessed a protected route" })
// })

export default routes