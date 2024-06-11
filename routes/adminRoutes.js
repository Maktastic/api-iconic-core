import express from "express";
import passport from "passport";
import multer from "multer";
import fileFilter from "../utils/fileFilter.js";

// Controllers
import productController from "../controllers/admin/productController.js";
import todoListController from "../controllers/admin/todoListController.js";
import documentController from "../controllers/admin/documentController.js";
import messageController from "../controllers/admin/messageController.js";
import accountController from "../controllers/admin/accountController.js";

// Validations
import validateBuyMiner from "../validations/admin/validateBuyMiner.js";
import validateDeleteMiner from "../validations/admin/validateDeleteMiner.js";
import validateUpdateMiner from "../validations/admin/validateUpdateMiner.js";
import insertListValidation from "../validations/admin/todoList/insertList.js";
import deleteListValidation from "../validations/admin/todoList/deleteList.js";
import updateListValidation from "../validations/admin/todoList/updateList.js";
import validateGetAdminLists from "../validations/admin/todoList/validateGetAdminLists.js";
import validateGlobalContracts from "../validations/admin/validateGlobalContracts.js";
import contractsController from "../controllers/admin/contractsController.js";


const adminRoutes = express.Router()

const AuthenticateAPI = passport.authenticate('jwt', { session: false })

const checkIsAdmin = async (req, res, next) => {
    if(req.isAuthenticated()) {
        const { isAdmin } = req.user
        if( isAdmin ) {
            next()
        } else {
            return res.status(401).send({ error: 'Unauthorized Admin Access', status: 400 })
        }
    } else {
        return res.status(401).send({ error: 'Unauthorized Access', status: 401 })
    }
}

// Admin Miner CRUD
adminRoutes.get('/product/all', AuthenticateAPI, checkIsAdmin, productController.getAllMiners)
adminRoutes.post('/product/add', AuthenticateAPI, checkIsAdmin, validateBuyMiner, productController.addMiner)
adminRoutes.post('/product/delete', AuthenticateAPI, checkIsAdmin, validateDeleteMiner, productController.deleteMiner)
adminRoutes.post('/product/update', AuthenticateAPI, checkIsAdmin, validateUpdateMiner, productController.updateMiner)


// ---------------- TODO LIST -----------------------
adminRoutes.get('/todo/all', AuthenticateAPI, checkIsAdmin, todoListController.getAllList)
adminRoutes.post('/todo/add', AuthenticateAPI, checkIsAdmin, insertListValidation, todoListController.addToList)
adminRoutes.post('/todo/delete', AuthenticateAPI, checkIsAdmin, deleteListValidation, todoListController.deleteList)
adminRoutes.post('/todo/update', AuthenticateAPI, checkIsAdmin, updateListValidation, todoListController.updateList)
adminRoutes.get('/todo/:id', AuthenticateAPI, checkIsAdmin, validateGetAdminLists, todoListController.getAdminLists)


// User Details
adminRoutes.get('/user/all', AuthenticateAPI, checkIsAdmin, accountController.getAllUsers) // get all users
adminRoutes.get('/user/:id', AuthenticateAPI, checkIsAdmin, accountController.getSpecificUser) // get specific user
// adminRoutes.post('/user/update', AuthenticateAPI, checkIsAdmin, accountController, accountController.updateUser)


// Secure Documents - Users
adminRoutes.post('/documents/status/:docType', AuthenticateAPI, checkIsAdmin, documentController.updateStatus)
adminRoutes.post('/documents/view/:docType', AuthenticateAPI, checkIsAdmin, documentController.viewDocument)

// Global Contracts
const storage = multer.memoryStorage();
const upload = multer({ storage: storage,  fileFilter: fileFilter });
adminRoutes.post('/global/contracts', AuthenticateAPI, checkIsAdmin, upload.single('file'), validateGlobalContracts, documentController.uploadGlobalContracts)
adminRoutes.get('/global/contracts', AuthenticateAPI, checkIsAdmin, documentController.getAllContracts)

// Global Messages
adminRoutes.get('/global/messages', AuthenticateAPI, checkIsAdmin, messageController.getMessages)
adminRoutes.post('/global/messages/add', AuthenticateAPI, checkIsAdmin, messageController.uploadMessages)
adminRoutes.post('/global/messages/update/:messageID', AuthenticateAPI, checkIsAdmin, messageController.updateMessages)


// User Contracts
adminRoutes.get('/user/contracts/all', AuthenticateAPI, checkIsAdmin, contractsController.getAllUserContracts)
adminRoutes.get('/user/contracts/:userID', AuthenticateAPI, checkIsAdmin, contractsController.getUserContracts)
adminRoutes.post('/user/contracts', AuthenticateAPI, checkIsAdmin, contractsController.updateUserContactStatus)

export default adminRoutes