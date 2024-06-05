import express from "express";
import passport from "passport";
import minerController from "../controllers/admin/minerController.js";
import validateBuyMiner from "../validations/admin/validateBuyMiner.js";
import validateDeleteMiner from "../validations/admin/validateDeleteMiner.js";
import accountController from "../controllers/admin/accountController.js";
import validateUpdateMiner from "../validations/admin/validateUpdateMiner.js";

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
adminRoutes.get('/miner/all', AuthenticateAPI, checkIsAdmin, minerController.getAllMiners)
adminRoutes.post('/miner/add', AuthenticateAPI, checkIsAdmin, validateBuyMiner, minerController.addMiner)
adminRoutes.post('/miner/delete', AuthenticateAPI, checkIsAdmin, validateDeleteMiner, minerController.deleteMiner)
adminRoutes.post('/miner/update', AuthenticateAPI, checkIsAdmin, validateUpdateMiner, minerController.updateMiner)


// User Details
adminRoutes.get('/user/all', AuthenticateAPI, checkIsAdmin, accountController.getAllUsers)


export default adminRoutes