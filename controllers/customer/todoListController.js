import Account from "../../schemas/accountSchema.js";
import Logbook from "../../config/logger.js";
import _ from 'lodash'
import mongoose from "mongoose";
import TODO from "../../schemas/todoSchema.js";


const todoListController = {
    getAllUserList: async(req, res) => {
        return new Promise( async (resolve, reject) => {
            const user = req?.user
            const userID = new mongoose.Types.ObjectId(user._id)

            const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
            const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
            const skip = (page - 1) * limit;

            const totalLists = await TODO.countDocuments({});
            const totalPages = Math.ceil(totalLists / limit);

            await TODO.find({ userID: userID })
                .sort({ status: 1 })
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

}

export default todoListController