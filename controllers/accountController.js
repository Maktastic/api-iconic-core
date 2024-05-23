import Account from "../schemas/accountSchema.js";
import _ from 'lodash'
import {generateRefreshToken, generateToken} from "../utils/tokenGeneration.js";
import Logbook from "../config/logger.js";

const accountController = {
    
    getUser: async (req, res) => {
        
    },
    
    register: async (req, res) => {
        return new Promise(async (resolve, reject) => {
            
            let { name, surname, mobile_number, email, password } = req.body;

            // Validate UAE phone number format
            const phoneRegex = /^\+971\d{9}$/;
            if (!phoneRegex.test(mobile_number)) {
                return res.status(400).send({ message: 'Invalid UAE phone number format'});
            }
            
            mobile_number = Number(mobile_number)
            
            // Check if the user already exists
            const existingAccount = Account.findOne({ $or: [ { mobile_number }, { email } ]})
            if(!existingAccount) {
                return res.status(400).send({ message: 'Account already exists' })   
            }
            
            await Account.create({
                name, surname, mobile_number, email, password
            }).then(async (result) => {
                if(result && _.size(result) !== 0) {   
                    let payload = { _id: result._id.toString() }
                    const accessToken = await generateToken(payload)
                    const refreshToken = await generateRefreshToken(payload)
                    res.cookie('refreshToken', refreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production', // Set to true in production
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
                    });
                    let userData = { name: result?.name, surname: result?.surname, mobile_number: result?.mobile_number, email: result?.email, _id: result?._id}
                    res.status(200).json({ userAccount: userData, token: accessToken, message: 'Account Created Successfully', status: 200 });
                }

            }).catch((error) => {
                Logbook.error(error)
                res.status(400).send({ message: 'Error Creating User Account', error: error?.errorResponse })
            })
            
            
        }).catch((error) => {
            console.error(error)
            res.status(500).send('Server Error')
        })
    },
    
    login: async (req, res) => {
        return new Promise(async (resolve, reject) => {

            let { email, password } = req.body;
            
            const user = await Account.findOne({ email })
            if(!user) {
                return res.status(400).send({ message: "Authentication Failed, User Not Found" })
            }
            
            await user.comparePasswords(password)
                .then(async (result) => {
                    if(result) {
                        let payload = { _id: user._id.toString() }
                        const accessToken = await generateToken(payload)
                        const refreshToken = await generateRefreshToken(payload)
                        res.cookie('refreshToken', refreshToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production', // Set to true in production
                            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
                        });
                        let userData = { name: user?.name, surname: user?.surname, mobile_number: user?.mobile_number, email: user?.email, _id: user?._id}
                        res.status(200).send({ message: "Log In Successful", status: 200, token: accessToken, userAccount: userData })
                    } else {
                        Logbook.error({ error: 'Email/Password is Incorrect', status: 400 })
                        res.status(400).send({ error: 'Email/Password is Incorrect', status: 400 })
                    }
                })
                .catch((error) => {
                    Logbook.error(error)
                    res.status(500).send('Internal Server Error')
                })
            
        }).catch((error) => {
            Logbook.error(error)
            res.status(500).send('Server Error')
        })
    },

    googleSuccess: async (req, res) => {
        
        if(req.isAuthenticated()) {
            const user = req.user
            let payload = { _id: user._id.toString() }
            const accessToken = await generateToken(payload)
            const refreshToken = await generateRefreshToken(payload)

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Set to true in production
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
            });

            res.redirect(`${process.env.BASE_PATH}/dashboard?login=success&status=200&token=${accessToken}`)
        } else {
            res.redirect('/login?google-auth-failure&status=400')
        }
    },
}

export default accountController