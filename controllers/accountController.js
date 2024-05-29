import Account from "../schemas/accountSchema.js";
import _ from 'lodash'
import {
    generateRefreshToken,
    generateTemporaryCode,
    generateTemporaryToken,
    generateToken
} from "../utils/tokenGeneration.js";
import Logbook from "../config/logger.js";
import {sendVerificationEmail, sendForgotPassword, sendChangePassword, sendChangeEmail} from "../config/mailer.js";

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
                    
                    if(!result?.isEmailVerified) {
                        const _id = result?._id
                        const temporaryToken = await generateTemporaryToken(_id)
                        await Account.findOne({ _id: _id })
                            .then(async (tempUser) => {
                                tempUser.tempToken = temporaryToken
                                await tempUser.save()
                            })
                            .then(async () => {
                                Logbook.info(`verify email to login: ${ _id }`)
                                const sendEmail = await sendVerificationEmail(result?.email, _id, temporaryToken)
                                if(sendEmail && sendEmail.response) {
                                    return res.status(200).send({
                                        message: 'Account created successfully. Verify email address to login',
                                        login: result?.isEmailVerified,
                                        status: 200
                                    })
                                } else {
                                    return res.status(400).send({
                                        message: 'Email was not successful, please try again later',
                                        status: 400
                                    })
                                }
                                
                            }).catch((error) => {
                                Logbook.error(error)
                                res.status(400).send({ error: error, status: 400 })
                                reject(error)
                            })
                        
                    } else {
                        let payload = { _id: result?._id.toString() }
                        const accessToken = await generateToken(payload)
                        const refreshToken = await generateRefreshToken(payload)
                        res.cookie('refreshToken', refreshToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production', // Set to true in production
                            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
                        });
                        let userData = result
                        userData = _.omit(userData.toObject(), ['password'])
                        res.status(200).json({ userAccount: userData, token: accessToken, message: 'Account Created Successfully', status: 200 });
                        Logbook.info('Account Created Successfully')
                    }
                }

            }).catch((error) => {
                Logbook.error(error)
                res.status(400).send({ message: 'Error Creating User Account', error: error?.errorResponse, status: 400 })
            })
            
            
        }).catch((error) => {
            Logbook.error(error)
            res.status(500).send('Server Error')
        })
    },
    
    login: async (req, res) => {
        return new Promise(async (resolve, reject) => {

            let { email, password } = req.body;
            
            const user = await Account.findOne({ email })
            if(!user) {
                return res.status(400).send({ error: "Authentication Failed, User Not Found", status: 400 })
            }
            
            await user.comparePasswords(password)
                .then(async (result) => {
                    if(result) {
                        let payload = { _id: user._id.toString() }
                        
                        if(!user?.isEmailVerified) {
                            const temporaryToken = await generateTemporaryToken(user._id)
                            Logbook.error('verify email to access dashboard: ', user._id)
                            user.tempToken = temporaryToken
                            await user.save()
                            await sendVerificationEmail(user.email, user._id, temporaryToken)
                            return res.status(200).send({ error: 'Verify email address to access dashboard!', emailVerify: user.isEmailVerified })
                            resolve()
                        } else {
                            ;
                            const accessToken = await generateToken(payload)
                            const refreshToken = await generateRefreshToken(payload)
                            res.cookie('refreshToken', refreshToken, {
                                httpOnly: true,
                                secure: process.env.NODE_ENV === 'production', // Set to true in production
                                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
                            });
                            res.cookie('accessToken', refreshToken, {
                                httpOnly: true,
                                secure: process.env.NODE_ENV === 'production', // Set to true in production
                                maxAge: 24 * 60 * 60 * 1000 // 7 days expiration
                            });
                            let userData = user
                            userData = _.omit(userData.toObject(), ['password'])
                            res.status(200).send({ message: "Log In Successful", status: 200, token: accessToken, userAccount: userData })
                            resolve()
                        }
                    } else {
                        Logbook.error({ error: 'Email/Password is Incorrect', status: 400 })
                        res.status(400).send({ error: 'Email/Password is Incorrect', status: 400 })
                        reject('Email/Password is Incorrect')
                    }
                })
                .catch((error) => {
                    Logbook.error(error)
                    res.status(400).send({ error: 'Email/Password is Incorrect', status: 400 })
                    reject(error)
                })
            
        }).catch((error) => {
            Logbook.error(error)
            res.status(500).send('Internal Server Error')
            reject(error)
        })
    },

    googleSuccess: async (req, res) => {
        
        if(req.isAuthenticated()) {
            const user = req.user
            let payload = { _id: user._id.toString() }
            const accessToken = await generateToken(payload)
            const refreshToken = await generateRefreshToken(payload)

            res.cookie('accessToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Set to true in production
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Set to true in production
                maxAge: 24 * 60 * 60 * 1000 // 7 days expiration
            });
            
            await Account.findById(user._id)
                .then(async (userDoc) => {
                    if(!userDoc) {
                        Logbook.error(`User Not Found: ${user._id}`)
                        return res.redirect(`${process.env.BASE_PATH}/login`)
                    }
                    
                    if(!userDoc.isEmailVerified && userDoc.googleID) {
                        userDoc.isEmailVerified = true
                        await userDoc.save()
                    }
                    
                })
                .then(() => {
                    Logbook.info('200: Google Authentication Success')
                    res.redirect(`${process.env.BASE_PATH}/dashboard?login=success&status=200&token=${accessToken}`)
                })
                .catch((error) => {
                    Logbook.error(`400: Google Authentication Failure: ${error}`)
                    res.redirect(`${process.env.BASE_PATH}/login?google-auth-failure&status=400`)
                })

        } else {
            Logbook.error('400: Google Authentication Failure')
            res.redirect(`${process.env.BASE_PATH}/login?google-auth-failure&status=400`)
        }
    },

    validateEmail: async (req, res) => {
        
        const { tempToken } = req.user
        const user_id = req.user._id.toString()
        
        if(!tempToken) {
            return res.status(400).send({ error: 'User not found', status: 400 })
        }
        
        await Account.findOne({ tempToken: tempToken })
            .then(async (result) => {
                if(result && _.size(result) !== 0) {
                    result.tempToken = null
                    result.isEmailVerified = true
                    await result.save()
                } else {
                    res.status(400).send({ error: 'User not found', status: 400 })
                }
            })
            .then(async () => {
                let payload = { _id: user_id }
                const accessToken = await generateToken(payload)
                const refreshToken = await generateRefreshToken(payload)

                res.cookie('accessToken', accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Set to true in production
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
                });

                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Set to true in production
                    maxAge: 24 * 60 * 60 * 1000 // 7 days expiration
                });
                Logbook.info(`200: Account ${user_id} verification success`)
                res.status(200).send({ 
                    message: `Account: ${user_id} verification successful`, 
                    redirectionURL: `${process.env.BASE_PATH}/dashboard?login=success&status=200&token=${accessToken}`,
                    status: 200
                })
            })
            .catch((error) => {
                Logbook.error(error)
                res.status(400).send({ error: error, status: 400 })
            })
        
    },

    // Forgot Password
    forgotPassword: async (req, res) => {
        
        const { email } = req.body
        
        await Account.findOne({ email: email })
            .then(async (userDoc) => {
                
                if(!userDoc) {
                    return res.status(400).send({ error: 'Account not found', status: 400 })
                }
                
                if(userDoc && userDoc.isEmailVerified) {
                    
                    const { tempCode, expiry } = generateTemporaryCode()
                    
                    userDoc.resetCode = tempCode
                    userDoc.resetExpiry = expiry
                    await userDoc.save()
                    await sendForgotPassword(userDoc.email, tempCode)
                    
                } else {
                    return res.status(400).send({ error: 'Email Account is not verified', status: 400 })
                }
            })
            .then(() => {
                Logbook.info('Email sent successfully')
                return res.status(200).send({ message: 'Email is sent successfully', status: 200 })
            }).catch((error) => {
                Logbook.error(error)
                return res.status(500).send({ error: error, status: 500 })
            })
        
    },

    // Change Password
    resetPassword: async (req, res) => {
        let userDoc;

        const { email, resetCode, newPassword } = req.body

        await Account.findOne({ email: email })
            .then(async (user) => {
                
                if(user && user.length !== 0) {
                    userDoc = user

                    if(userDoc && userDoc.resetExpiry < Date.now() ) {
                        return res.status(400).send({ error: 'Expired Code', status: 400 })
                    }

                    if(userDoc && parseInt(userDoc.resetCode) !== parseInt(resetCode)) {
                        return res.status(400).send({ error: 'Invalid Code', status: 400 })
                    }

                    if(userDoc && !userDoc.isEmailVerified) {
                        return res.status(400).send({ error: 'Email is not verified', status: 400 })
                    }

                    else {
                        userDoc.password = newPassword
                        userDoc.resetCode = null
                        userDoc.resetExpiry = null
                        await userDoc.save().then(() => {
                            Logbook.info('Password updated successfully')
                            return res.status(200).send({ message: 'Password has been updated successfully', status: 200 })
                        }).catch((error) => {
                            Logbook.error('Password not updated')
                            return res.status(400).send({ error: error, status: 400 })
                        })
                    }
                }
                

            })
            .catch(error => {
                Logbook.error(error)
                return res.status(400).send({ error: 'User could not be found', status: 400 })
            })
    },
    
    resetEmail: async(req, res) => {
      
        const { newEmail, resetCode } = req.body
        const user = req.user
        
        await Account.findOne({ _id: user._id })
            .then( async (userDoc) =>  {
                
                if(userDoc && userDoc.resetExpiry < Date.now() ) {
                    return res.status(400).send({ error: 'Expired Code', status: 400 })
                }

                if(userDoc && parseInt(userDoc.resetCode) !== parseInt(resetCode)) {
                    return res.status(400).send({ error: 'Invalid Code', status: 400 })
                }

                if(userDoc && !userDoc.isEmailVerified) {
                    return res.status(400).send({ error: 'Email is not verified', status: 400 })
                }
                
                else {
                    userDoc.email = newEmail
                    userDoc.resetCode = null
                    userDoc.resetExpiry = null
                    await userDoc.save().then(() => {
                        Logbook.info(`${user._id}: Email updated successfully`)
                        return res.status(200).send({ message: 'Account email has been updated successfully', status: 200 })
                    }).catch((error) => {
                        Logbook.error(`${user._id}: User email could not be updated`)
                        return res.status(400).send({ error: error, status: 400 })
                    })
                }
                
            })
            .catch((error) => {
                Logbook.error(`${user._id}: ${error}`)
                return res.status(400).send({ error: error, status: 400 })
            })
        
    },
    
    // Request Change Password Code
    changePassword: async(req, res) => {
        
        const { currentPassword } = req.body
        
        const user = req.user
        
        await Account.findOne({ _id: user._id })
            .then(async (userDoc) => {
                
                const checkCurrentPwd = await userDoc.comparePasswords(currentPassword)
                
                if(checkCurrentPwd) {

                    const { tempCode, expiry } = generateTemporaryCode()

                    userDoc.resetCode = tempCode
                    userDoc.resetExpiry = expiry
                    await userDoc.save()
                    await sendChangePassword(userDoc.email, tempCode).catch((error) => {
                        return res.status(400).send({ error: error, status: 400 })
                    })
                    
                    Logbook.info(`${user._id}: Password Change code sent successfully`)
                    return res.status(200).send({ message: 'Password change code sent successfully', status: 200 })
                    
                } else {
                    Logbook.error(`${user._id}: Current Password invalid`)
                    return res.status(400).send({ error: 'Current Password is invalid.', status: 400 })
                }
                
            }).catch(error => {
                Logbook.error(`${user._id} not found`)
                res.status(400).send({ error: 'User not found', status: 400 })
            })
        
    },
    
    // Request Change Email Code
    changeEmail: async(req, res) => {
        const { newEmail } = req.body // get new email
        const user = req.user
        
        const checkExistingEmail = await Account.findOne({ email: newEmail })
        
        if(checkExistingEmail) {
            return res.status(400).send({ error: 'Email address already in use.', status: 400 })
        }

        if(user && !user.isEmailVerified) {
            return res.status(400).send({ error: 'Account email address is not verified', status: 400 })
        }
        
        await Account.findOne({ _id: user._id })
            .then(async (userDoc) => {

                const { tempCode, expiry } = generateTemporaryCode()
                userDoc.resetCode = tempCode
                userDoc.resetExpiry = expiry
                await userDoc.save()
                await sendChangeEmail(userDoc.email, tempCode)
                    .then(() => {
                        Logbook.info('Email code sent successfully.')
                        return res.status(200).send({ message: 'Email code sent successfully', status: 200 })
                    }).catch((error) => {
                        Logbook.error(error)
                        return res.status(400).send({ error: error, status: 400 })
                    })
                
            }).catch((error) => {
                Logbook.error(`${user._id}: User not found`)
                return res.status(400).send({ error: error, status: 400 })
            })
    }

    
}

export default accountController