
import Account from '../../schemas/accountSchema.js'
const accountController = {

    // get all users
    getAllUsers: async( req, res) => {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
        const skip = (page - 1) * limit;

        const totalAccounts = await Account.countDocuments({});
        const totalPages = Math.ceil(totalAccounts / limit);

        await Account.find({}, { password: 0 })
            .skip(skip)
            .limit(limit)
            .then(async (userData) => {
                if(userData) {
                    res.status(200).send({
                        users: userData,
                        status: 200,
                        meta: {
                            total_pages: totalPages,
                            currentPage: page,
                            total_accounts: totalAccounts,
                            isLastPage: page >= totalPages
                    } })
                }
            })
            .catch((error) => {
                res.status(500).send({ error: 'Internal Server Error', status: 500})
            })
    }

}

export default accountController