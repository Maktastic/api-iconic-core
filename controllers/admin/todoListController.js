import Account from "../../schemas/accountSchema.js";
import Logbook from "../../config/logger.js";
import todoSchema from "../../schemas/todoSchema.js";
import _ from 'lodash'
import mongoose from "mongoose";
import TODO from "../../schemas/todoSchema.js";


const todoListController = {
    getAllList: async(req, res) => {
        return new Promise( async (resolve, reject) => {
            const user = req?.user
            const userID = new mongoose.Types.ObjectId(user._id)

            await TODO.find({ userID: userID, status: true }).then((response) => {
                    if(response && response.length !== 0) {
                        return res.status(200).send({ todoList: response, status: 200 })
                    }
                    else {
                        return res.status(400).send({ error: 'No List found', status: 400 })
                    }
                })
                .catch((error) => {
                    Logbook.error(error)
                    res.status(400).send({ error: error, status: 400 })
                    reject(error)
                })
        })
    },

    addToList: async(req, res) => {

        return new Promise(async (resolve, reject) => {
            const user = req?.user
            let { title, message, userID } = req.body
            userID = new mongoose.Types.ObjectId(userID)

            if(!user.isAdmin) {
                Logbook.error(`${user._id}: Unauthorized Access`)
                return res.status(401).send({ error: 'Unauthorized Access', status: 401 })
            }

            await TODO.create({
                title: title,
                message: message,
                userID: userID
            })
                .then((response) => {
                    if(response) {
                        res.status(200).send({ message: 'List Added Successfully', status: 200 })
                        resolve()
                    }
                })
                .catch((error) => {
                    Logbook.error('Error adding todo item to todolist:', error);
                    res.status(400).send({ error: error, status: 400 })
                    reject(error)
                })
        })
    },

    deleteList: async (req, res) => {
        return new Promise(async (resolve, reject) => {
            const user = req?.user
            let { userID, listID } = req.body
            userID = new mongoose.Types.ObjectId(userID)

            if(!user.isAdmin) {
                Logbook.error(`${user._id}: Unauthorized Access`)
                return res.status(401).send({ error: 'Unauthorized Access', status: 401 })
            }

            await TODO.deleteOne({ userID: userID, status: true, _id: listID })
                .then((response) => {
                    if(response) {
                        return res.status(200).send({ message: 'List deleted successfully', status: 200 })
                    }
                    else {
                        return res.status(400).send({ error: response, status: 400 })
                    }
                })
                .catch((error) => {
                    Logbook.error(error)
                    return res.status(400).send({ error: error, status: 400 })
                })
        })
    },

    updateList: async (req, res) => {
        const user = req?.user;
        const { userID, listID, updatedList } = req.body;

        // Convert userID to ObjectId if it's not already
        const userObjectId = new mongoose.Types.ObjectId(userID);

        try {
            // Check if the user is admin
            if (!user.isAdmin) {
                Logbook.error(`${user._id}: Unauthorized Access`);
                return res.status(401).send({ error: 'Unauthorized Access', status: 401 });
            }

            const todo = await TODO.findOne({ _id: listID, userID: userObjectId });
            if (!todo) {
                return res.status(404).send({ error: 'Todo item not found', status: 404 });
            }

            // Update the fields
            todo.title = updatedList.title;
            todo.message = updatedList.message;
            todo.status = updatedList.status;

            await todo.save();

            res.status(200).send({ message: 'Todo item updated successfully', todo });
        } catch (error) {
            Logbook.error(error);
            res.status(400).send({ error: 'Something went wrong, please try again later.', status: 400 });
        }
    }


}

export default todoListController