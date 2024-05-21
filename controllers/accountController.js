import Account from "../schemas/accountSchema.js";

const accountController = {
    
    register: async (req, res) => {
        return new Promise((resolve, reject) => {
            
            const { name, surname, mobile_number, email, password } = req.body;

            // Validate UAE phone number format
            const phoneRegex = /^\+971\d{9}$/;
            if (!phoneRegex.test(mobile_number)) {
                return res.status(400).send('Invalid UAE phone number format');
            }

            // Check if the user already exists
            const existingAccount = Account.findOne({ $or: [ { mobile_number}, { email } ]})


        }).catch((error) => {
            console.error(error)
            res.status(500).send('Server Error')
        })
    }
    
}

export default accountController