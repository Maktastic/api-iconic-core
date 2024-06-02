import express from "express";
import passport from "passport";
import multer from "multer";
import fileFilter from "../utils/fileFilter.js";

const routes = express.Router()

const AuthenticateAPI = passport.authenticate('jwt', { session: false })

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
import validateForgotPassword from "../validations/validateForgotPassword.js";
import validateResetPassword from "../validations/validateResetPassword.js";
import validateChangePassword from "../validations/validateChangePassword.js";
import validateChangeEmail from "../validations/validateChangeEmail.js";
import uploadController from "../controllers/uploadController.js";
import validateUploads from "../validations/validateUploads.js";

// ---------------- Non-Authenticated Routes -----------------------
routes.post('/register', validateRegister, accountController.register)
routes.post('/login', validateLogin, accountController.login)
// ---------------- Non-Authenticated Routes -----------------------

// ---------------- Authenticated Routes -----------------------
routes.post('/verify/email', AuthenticateAPI, accountController.validateEmail)
routes.post('/calculate', AuthenticateAPI, validateCalculation, calculateController.calculate)

// ---------------- Authenticated Routes -----------------------

// ---------------- Secure Google Authentication -----------------------
routes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] } ));
routes.get('/google/callback', passport.authenticate('google', 
    { failureRedirect: `${process.env.BASE_PATH}/login?google-auth-failure&status=400` }), 
    accountController.googleSuccess);
// ---------------- Secure Google Authentication -----------------------

// ---------------- TODO API's -----------------------
routes.get('/todo/all', AuthenticateAPI, todoListController.getAllList)
routes.post('/todo/add', AuthenticateAPI, insertListValidation, todoListController.addToList)
routes.post('/todo/delete', AuthenticateAPI, deleteListValidation, todoListController.deleteList)
routes.post('/todo/update', AuthenticateAPI, updateListValidation, todoListController.updateList)
// ---------------- TODO API's -----------------------

// ---------------- Forgot Password -----------------------
routes.post('/user/forgot-password', validateForgotPassword, accountController.forgotPassword)
// ---------------- Forgot Password -----------------------

// ---------------- Resets -----------------------
routes.post('/user/reset-password', validateResetPassword, accountController.resetPassword)
routes.post('/user/reset-email', AuthenticateAPI, accountController.resetEmail)
// ---------------- Resets -----------------------

// ---------------- Changes -----------------------
routes.post('/user/change-password', AuthenticateAPI, validateChangePassword, accountController.changePassword)
routes.post('/user/change-email', AuthenticateAPI, validateChangeEmail, accountController.changeEmail)
// ---------------- Changes -----------------------

// ---------------- Two Factor Authentication -----------------------
routes.get('/user/two-factor-auth', AuthenticateAPI, accountController.twoFactorAuth)
routes.post('/user/two-factor-auth', AuthenticateAPI, accountController.verifyTwoFactorAuth)
// ---------------- Two Factor Authentication -----------------------

const storage = multer.memoryStorage();
const upload = multer({ storage: storage,  fileFilter: fileFilter });
routes.post('/upload/documents', validateUploads, AuthenticateAPI, upload.array('files', 1), uploadController.uploadDocuments)

export default routes