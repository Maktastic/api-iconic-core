import UserContract from "../../schemas/userContractsSchema.js";
import Logbook from "../../config/logger.js";
import mongoose from "mongoose";


const contractsController = {

    getAllUserContracts: async ( req, res ) => {

        try {
            const contracts = await UserContract.find({})

            res.status(200).send({ message: 'All Contracts Retrieved Successfully', status: 200, data: contracts });
        } catch (error) {
            Logbook.error('Error retrieving all contracts:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }
    },

    getUserContracts: async ( req, res) => {
        let { userID } = req.params

        if(!userID) {
            return res.status(400).send({ error: 'userID is missing', status: 400 })
        }

        userID = new mongoose.Types.ObjectId(userID)

        try {
            const contracts = await UserContract.find({ createdBy: userID })

            res.status(200).send({ message: 'All Contracts Retrieved Successfully', status: 200, data: contracts });
        } catch (error) {
            Logbook.error('Error retrieving all contracts:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }

    },

    updateUserContactStatus: async ( req, res ) => {
        const { userID, contractID, status } = req.body

        if(!userID || !contractID) {
            return res.status(400).send({ error: 'UserID/ContractID is missing', status: 400 })
        }

        if(!['approved', 'denied'].includes(status)) {
            return res.status(404).send({ error: 'Invalid Status', status: 404 })
        }

        try {
            const contract = await UserContract.findByIdAndUpdate(
                {createdBy: userID, _id: contractID},
                { status },
                { new: true }
            );

            if (!contract) {
                return res.status(404).send({ error: 'Contract not found', status: 404 });
            }

            res.status(200).send({ message: 'Contract status updated successfully', status: 200, data: contract });
        } catch (error) {
            console.error('Error updating contract status:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }

    }
}

export default contractsController