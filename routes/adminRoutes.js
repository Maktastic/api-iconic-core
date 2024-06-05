import express from "express";
import passport from "passport";

// Controllers
import productController from "../controllers/admin/productController.js";
import todoListController from "../controllers/admin/todoListController.js";

// Validation
import validateBuyMiner from "../validations/admin/validateBuyMiner.js";
import validateDeleteMiner from "../validations/admin/validateDeleteMiner.js";
import accountController from "../controllers/admin/accountController.js";
import validateUpdateMiner from "../validations/admin/validateUpdateMiner.js";
import insertListValidation from "../validations/admin/todoList/insertList.js";
import deleteListValidation from "../validations/admin/todoList/deleteList.js";
import updateListValidation from "../validations/admin/todoList/updateList.js";
import validateGetAdminLists from "../validations/admin/todoList/validateGetAdminLists.js";

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
adminRoutes.get('/todo/all', AuthenticateAPI, todoListController.getAllList)
adminRoutes.post('/todo/add', AuthenticateAPI, checkIsAdmin, insertListValidation, todoListController.addToList)
adminRoutes.post('/todo/delete', AuthenticateAPI, checkIsAdmin, deleteListValidation, todoListController.deleteList)
adminRoutes.post('/todo/update', AuthenticateAPI, checkIsAdmin, updateListValidation, todoListController.updateList)
adminRoutes.get('/todo/:id', AuthenticateAPI, checkIsAdmin, validateGetAdminLists, todoListController.getAdminLists)


// User Details
adminRoutes.get('/user/all', AuthenticateAPI, checkIsAdmin, accountController.getAllUsers)
adminRoutes.post('/user/update', AuthenticateAPI, checkIsAdmin)


export default adminRoutes