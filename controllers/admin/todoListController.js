import Account from "../../schemas/accountSchema.js";
import Logbook from "../../config/logger.js";
import _ from 'lodash'
import mongoose from "mongoose";
import TODO from "../../schemas/todoSchema.js";


const todoListController = {
    getAllList: async(req, res) => {
        return new Promise( async (resolve, reject) => {
            const user = req?.user
            const userID = new mongoose.Types.ObjectId(user._id)

            const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
            const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
            const skip = (page - 1) * limit;

            const totalLists = await TODO.countDocuments({});
            const totalPages = Math.ceil(totalLists / limit);

            await TODO.find({ userID: userID, status: true })
                .skip(skip)
                .limit(limit)
                .then((response) => {
                    if(response && response.length !== 0) {
                        return res.status(200).send({ todoList: response, status: 200, meta: {
                                total_pages: totalPages,
                                currentPage: page,
                                total_lists: totalLists,
                                isLastPage: page >= totalPages
                            }
                        })
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
            let { title, message, userID } = req.body
            userID = new mongoose.Types.ObjectId(userID)

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

            try {
                const checkListExists = await TODO.findOne({ _id: listID, userID: userID })
                if(!checkListExists) {
                    return res.status(404).send({ error: 'List does not exist', status: 404 })
                }
            }
            catch(error) {
                return res.status(400).send({ error: error, status: 400})
            }

            await TODO.deleteOne({ userID: userID, _id: listID })
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
        .catch((error) => {
            return res.status(500).send({ error: 'Internal Server Error', status: 500 })
        } )
    },

    updateList: async (req, res) => {
        const user = req?.user;
        const { userID, listID, updatedList } = req.body;

        // Convert userID to ObjectId if it's not already
        const userObjectId = new mongoose.Types.ObjectId(userID);

        try {
            // Check if the user is admin

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
    },

    getAdminLists: async ( req, res ) => {

        let { id } = req.params;
        id = new mongoose.Types.ObjectId(id)

        const checkUserExists = await Account.findOne({ _id: id })

        if(!checkUserExists) {
            return res.status(404).send({ error: 'User not found', status: 404 })
        }

        await TODO.find({ userID: id } )
            .then((response) => {

                if(response) {
                   return res.status(200).send({ todo_lists: response, status: 200 })
                }

            })
            .catch((error) => {
                Logbook.error(error)
                return res.status(400).send({ error: 'No List Found', status: 400 })
            })

    }


}

export default todoListController