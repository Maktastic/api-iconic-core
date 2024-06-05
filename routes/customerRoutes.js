import express from "express";
import passport from "passport";
import multer from "multer";
import fileFilter from "../utils/fileFilter.js";

const routes = express.Router()

const AuthenticateAPI = passport.authenticate('jwt', { session: false })

// Controllers
import accountController from "../controllers/customer/accountController.js";
import calculateController from "../controllers/customer/calculateController.js";
import cartController from "../controllers/customer/cartController.js";
import uploadController from "../controllers/customer/uploadController.js";

//Validations
import validateLogin from "../validations/customer/validateLogin.js";
import validateRegister from "../validations/customer/validateRegister.js";
import validateCalculation from "../validations/customer/validateCalculation.js";
import validateForgotPassword from "../validations/customer/validateForgotPassword.js";
import validateResetPassword from "../validations/customer/validateResetPassword.js";
import validateChangePassword from "../validations/customer/validateChangePassword.js";
import validateChangeEmail from "../validations/customer/validateChangeEmail.js";
import validateUploads from "../validations/customer/validateUploads.js";
import countriesController from "../controllers/customer/countriesController.js";

// ---------------- Non-Authenticated Routes -----------------------
routes.post('/register', validateRegister, accountController.register)
routes.post('/login', validateLogin, accountController.login)


// ---------------- Authenticated Routes -----------------------
routes.post('/verify/email', AuthenticateAPI, accountController.validateEmail)
routes.post('/calculate', AuthenticateAPI, validateCalculation, calculateController.calculate)


// ---------------- Secure Google Authentication -----------------------
routes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] } ));
routes.get('/google/callback', passport.authenticate('google', 
    { failureRedirect: `${process.env.BASE_PATH}/login?google-auth-failure&status=400` }), 
    accountController.googleSuccess);



// ---------------- Forgot Password -----------------------
routes.post('/user/forgot-password', validateForgotPassword, accountController.forgotPassword)


// ---------------- Resets -----------------------
routes.post('/user/reset-password', validateResetPassword, accountController.resetPassword)
routes.post('/user/reset-email', AuthenticateAPI, accountController.resetEmail)


// ---------------- Changes -----------------------
routes.post('/user/change-password', AuthenticateAPI, validateChangePassword, accountController.changePassword)
routes.post('/user/change-email', AuthenticateAPI, validateChangeEmail, accountController.changeEmail)


// ---------------- Two Factor Authentication -----------------------
routes.get('/user/two-factor-auth', AuthenticateAPI, accountController.twoFactorAuth)
routes.post('/user/two-factor-auth', AuthenticateAPI, accountController.verifyTwoFactorAuth)


// ---------------- Upload Secure Documents -----------------------
const storage = multer.memoryStorage();
const upload = multer({ storage: storage,  fileFilter: fileFilter });
routes.post('/upload/documents', validateUploads, AuthenticateAPI, upload.array('files', 1), uploadController.uploadDocuments)


// ---------------- Cart -----------------------
routes.post('/cart', AuthenticateAPI, cartController.createCart)

// ---------------- Countries -----------------------
routes.get('/countries', countriesController.getCountries)

// ---------------- User Details -----------------------
routes.get('/user/account', AuthenticateAPI, accountController.getUser)


export default routes