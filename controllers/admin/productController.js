import Product from "../../schemas/productSchema.js";
import Logbook from "../../config/logger.js";
import mongoose from "mongoose";
import Account from "../../schemas/accountSchema.js";


const productController = {

    getAllMiners: async (req, res) => {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
        const skip = (page - 1) * limit;

        const totalProducts = await Product.countDocuments({});
        const totalPages = Math.ceil(totalProducts / limit);

        await Product.find({})
            .skip(skip)
            .limit(limit)
            .then((response) => {

                res.status(200).send({ miners: response, status: 200, meta: {
                        total_pages: totalPages,
                        currentPage: page,
                        total_accounts: totalProducts,
                        isLastPage: page >= totalPages
                    } })

            })
            .catch((error) => {
                Logbook.error(error)
                res.status(400).send({ error: 'Internal Server Error', status: 400 })
            })

    },

    addMiner: async(req, res) => {
        const { expected_price, EOI, type } = req.body

        if(!expected_price || !EOI) {
            Logbook.error('Invalid Request Parameters')
            return res.status(400).send({ error: 'Invalid Request Parameters', status: 400 })
        }

        const checkType = await Product.findOne({ type: type })
        if(!checkType) {
            return res.status(404).send({ error: "type field doesnt match: fullMiner | partialMiner | container" })
        }

        let payload = {
            expected_price: expected_price,
            EOI: EOI,
            type: type
        }

        await Product.create(payload)
            .then((response) => {
                if(response) {
                    return res.status(200).send({ message: 'Product created successfully', status: 200 })
                }
            })
            .catch((error) => {
                Logbook.error(error)
                return res.status(400).send({ error: 'Error creating product'})
            })

    },

    deleteMiner: async(req, res) => {
        let { minerID } = req.body
        minerID = new mongoose.Types.ObjectId(minerID)

        const checkMinerExists = await Product.findOne({ _id: minerID })

        if(!checkMinerExists) {
            return res.status(400).send({ error: 'Product does not exist', status: 400 })
        }

        await Product.deleteOne({ _id: minerID })
            .then((response) => {
                if(response) {
                    return res.status(200).send({ message: 'Deleted Product successfully', status: 200 })
                }
            })
            .catch((error) => {
                return res.status(400).send({ error: 'Something went wrong, please try again later', status: 400 })
            })
    },

    updateMiner: async( req, res) => {
        let { minerID, expected_price, EOI } = req.body

        minerID = new mongoose.Types.ObjectId(minerID)

        const checkMinerExists = await Product.findOne({ _id: minerID })

        if(!checkMinerExists) {
            return res.status(400).send({ error: 'Product does not exist', status: 400 })
        }

        await Product.updateOne({ _id: minerID }, { $set: { expected_price: expected_price, EOI: EOI }})
            .then((response) => {

                if(response) {
                    Logbook.info({ message: 'Product updated successfully', status: 200 })
                    return res.status(200).send({ message: 'Product updated successfully', status: 200 })
                }

            })
            .catch((error) => {
                Logbook.error(error)
                return res.status(404).send({ error: 'Product could not be updated', status: 404 })
            })
    },




}


export default productController