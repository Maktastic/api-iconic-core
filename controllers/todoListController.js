import Account from "../schemas/accountSchema.js";
import Logbook from "../config/logger.js";
import todoSchema from "../schemas/todoSchema.js";
import _ from 'lodash'
import updateList from "../validations/todoList/updateList.js";
import mongoose from "mongoose";


const todoListController = {
    getAllList: async(req, res) => {
        return new Promise( async (resolve, reject) => {
            const user = req?.user
            const userID = user._id.toString()

            await Account.findById(userID)
                .then(async (userDoc) => {
                    if(!userDoc) {
                        Logbook.error('User Not Found: ', userID)
                        res.status(400).send({ error: 'User not found', status: 400 })
                        reject(`User Not Found: ${userID}`)
                        return
                    }
                    res.status(200).send(userDoc.todoList)
                    resolve()
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
            userID = userID.toString()

            if(!user.isAdmin) {
                Logbook.error(`${user._id}: Unauthorized Access`)
                return res.status(401).send({ error: 'Unauthorized Access', status: 401 })
            }

            await Account.findById(userID)
                .then(async (userDoc) => {
                    if (!userDoc) {
                        Logbook.error('User Not Found: ', userID)
                        res.status(400).send({ error: 'User not found', status: 400 })
                        reject(`User Not Found: ${userID}`)
                        return
                    }
                    userDoc.todoList.push({ title, message });
                    await userDoc.save();
                }).then(() => {
                    res.status(200).send({ message: 'List Added Successfully', status: 200 })
                    resolve()
                }).catch((error) => {
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
            userID = userID.toString()

            if(!user.isAdmin) {
                Logbook.error(`${user._id}: Unauthorized Access`)
                return res.status(401).send({ error: 'Unauthorized Access', status: 401 })
            }

            await Account.findById(userID)
                .then(async (userDoc) => {
                    if(!userDoc) {
                        Logbook.error('User Not Found: ', userID)
                        res.status(400).send({ error: 'User not found', status: 400 })
                        reject(`User Not Found: ${userID}`)
                        return
                    }
                    await userDoc.todoList.pull(listID)
                    await userDoc.save()
                        .then(() => {
                            res.status(200).send({ message: "Item list deleted successfully", status: 200 })
                            resolve()
                        })
                        .catch((error) => {
                            Logbook.error(error)
                            res.status(400).send({ error: error, status: 400 })
                            reject(error)
                        })
                }).catch((error) => {
                    Logbook.error(error)
                    res.status(400).send({ error: 'User Not Found', status: 400 })
                    reject(error)
                })
        })
    },
    
    updateList: async (req, res) => {
        return new Promise( async (resolve, reject) => {
            const user = req?.user
            let { userID, id, updatedList } = req.body
            userID = userID.toString()

            if(!user.isAdmin) {
                Logbook.error(`${user._id}: Unauthorized Access`)
                return res.status(401).send({ error: 'Unauthorized Access', status: 401 })
            }
            
            const validateUpdatedList = new mongoose.model('TodoList', todoSchema)(updatedList).validateSync()
            if(validateUpdatedList?.errors) {
                return res.status(400).send({ error: validateUpdatedList.errors, status: 400 })
            }
            
            await Account.findById(userID) 
                .then( async (userDoc) => {
                    if(!userDoc) {
                        Logbook.error('User Not Found: ', userID)
                        res.status(400).send({ error: 'User not found', status: 400 })
                        reject(`User Not Found: ${userID}`)
                        return
                    }

                    const todoItem = userDoc.todoList.id(id);

                    if (!todoItem) {
                        Logbook.error(`Todo item not found: ${id}`);
                        res.status(400).send({ error: `Item list not found: ${id}`, status: 400 })
                        reject(`Item not found: ${id}`)
                        return
                    }
                    
                    await Account.updateOne({ _id: userID, 'todoList._id': id }, { 
                            $set: {
                                'todoList.$.title': updatedList.title,
                                'todoList.$.message': updatedList.message
                            }
                        })

                })
                .then(() => {
                    res.status(200).send({ message: 'Item updated successfully', status: 200 })
                    resolve()
                })
                .catch((error) => {
                    Logbook.error(error)
                    res.status(400).send({ error: error, status: 400 })
                    reject(error)
                })
            
        })
    }
}

export default todoListController