import BuyMiner from "../../schemas/minerSchema.js";
import Logbook from "../../config/logger.js";
import mongoose from "mongoose";


const minerController = {

    getAllMiners: async (req, res) => {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
        const skip = (page - 1) * limit;

        await BuyMiner.find({})
            .skip(skip)
            .limit(limit)
            .then((response) => {

                res.status(200).send({ miners: response, status: 200 })

            })
            .catch((error) => {
                Logbook.error(error)
                res.status(400).send({ error: 'Internal Server Error', status: 400 })
            })

    },

    addMiner: async(req, res) => {
        const { expected_price, EOI } = req.body

        if(!expected_price || !EOI) {
            Logbook.error('Invalid Request Parameters')
            return res.status(400).send({ error: 'Invalid Request Parameters', status: 400 })
        }

        let payload = {
            expected_price: expected_price,
            EOI: EOI
        }

        await BuyMiner.create(payload)
            .then((response) => {
                if(response) {
                    return res.status(200).send({ message: 'buyMiner product created successfully', status: 200 })
                }
            })
            .catch((error) => {
                Logbook.error(error)
                return res.status(400).send({ error: 'Error creating buyMiner product'})
            })

    },

    deleteMiner: async(req, res) => {
        let { minerID } = req.body
        minerID = new mongoose.Types.ObjectId(minerID)

        const checkMinerExists = await BuyMiner.findOne({ _id: minerID })

        if(!checkMinerExists) {
            return res.status(400).send({ error: 'Miner does not exist', status: 400 })
        }

        await BuyMiner.deleteOne({ _id: minerID })
            .then((response) => {
                if(response) {
                    return res.status(200).send({ message: 'Deleted Miner successfully', status: 200 })
                }
            })
            .catch((error) => {
                return res.status(400).send({ error: 'Something went wrong, please try again later', status: 400 })
            })
    },

    updateMiner: async( req, res) => {
        let { minerID } = req.body



    }




}


export default minerController