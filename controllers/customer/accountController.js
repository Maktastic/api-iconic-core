import Account from "../../schemas/accountSchema.js";
import _ from 'lodash'
import {
    generateRefreshToken,
    generateTemporaryCode, generateTemporaryToken,
    generateToken,
    generateTwoFactorSecret, verifyToken
} from "../../utils/tokenGeneration.js";
import Logbook from "../../config/logger.js";
import {
    sendChangeEmail,
    sendChangePassword, sendChangePhoneNumber,
    sendEmailVerification,
    sendForgotPassword,
    sendVerificationEmail, sendVerificationSMS
} from "../../config/mailer.js";
import qrcode from "qrcode";
import speakeasy from "speakeasy";
import parsePhoneNumber from 'libphonenumber-js'
import mongoose from "mongoose";
import GlobalContracts from "../../schemas/globalContractsSchema.js";

const accountController = {
    
    getUser: async (req, res) => {

        if(req.isAuthenticated()) {
            const { _id } = req.user

            await Account.findOne({ _id: new mongoose.Types.ObjectId(_id) }, { password: 0 })
                .then((response) => {
                    if(response) {
                        return res.status(200).send({ userData: response, status: 200 })
                    }
                })
                .catch((error) => {
                    return res.status(400).send({ error: 'User not found', status: 400 })
                })

        } else {
            return res.status(400).send({ error: 'Unauthorized Access', status: 400 })
        }


    },
    
    register: async (req, res) => {
        return new Promise(async (resolve, reject) => {
            
            let { name, surname, mobile_number, email, password } = req.body;

            // Validate UAE phone number format
            if(!mobile_number.includes('+')) {
                mobile_number = '+' + mobile_number
            }

            let parsedNumber = parsePhoneNumber(mobile_number)
            let isValidNumber = parsedNumber.isValid()

            if(!isValidNumber) {
                return res.status(400).send({ error: 'Mobile Number is invalid'})
            }

            // Check if the user already exists
            const existingAccount = await Account.findOne({ email } )
            if(existingAccount) {
                return res.status(400).send({ error: 'Email already exists', status: 400 })
            }
            
            await Account.create({
                name, surname, mobile_number, email, password
            }).then(async (result) => {
                if(result && _.size(result) !== 0) {

                    let payload = { _id: result?._id.toString() }
                    const accessToken = await generateToken(payload)
                    const refreshToken = await generateRefreshToken(payload)

                    result.refreshToken = refreshToken
                    await result.save().catch((error) => {
                        return res.status(400).send({ error: 'Internal Server Error', status: 400 })
                    })

                    res.cookie('refreshToken', refreshToken, {
                        httpOnly: process.env.NODE_ENV === 'production',
                        secure: process.env.NODE_ENV === 'production', // Set to true in production
                        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
                    });
                    res.cookie('accessToken', accessToken, {
                        httpOnly: process.env.NODE_ENV === 'production',
                        secure: process.env.NODE_ENV === 'production', // Set to true in production
                        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                        maxAge: 24 * 60 * 60 * 1000 // 7 days expiration
                    });
                    let userData = result
                    userData = _.omit(userData.toObject(), ['password'])
                    Logbook.info('Account Created Successfully')
                    res.status(200).json({ userAccount: userData, token: accessToken, message: 'Account Created Successfully', status: 200 });
                }

            }).catch((error) => {
                const ResponseError = error.errorResponse
                Logbook.error(ResponseError.errmsg)
                if(ResponseError && ResponseError.code === 11000) {
                    const key = Object.keys(ResponseError?.keyPattern)
                    return res.status(400).send({ error: `${key} is already being used`, status: 400 })
                }
                else {
                    return res.status(400).send({ error: 'Error Creating User Account', errorResponse: error?.errorResponse, status: 400 })
                }
            })

        }).catch((error) => {
            Logbook.error(error)
            res.status(500).send('Server Error')
        })
    },
    
    login: async (req, res) => {
        return new Promise(async (resolve, reject) => {

            let { email, password } = req.body;
            
            await Account.findOne({ email } )
                .then(async (userDoc) => {
                    if(userDoc) {
                        const user = userDoc
                        await userDoc.comparePasswords(password)
                            .then(async (result) => {
                                if(result) {

                                    let payload = { _id: user._id.toString() }

                                    if(user?.isEmailVerified && user?.googleID) {
                                        Logbook.error(`${user._id}: Google Account exists. Login using google.`)
                                        return res.status(400).send({ error: 'Account already exists with google. Please log in using google account', status: 400 })
                                    }
                                    else {
                                        const accessToken = await generateToken(payload)
                                        const refreshToken = await generateRefreshToken(payload)

                                        userDoc.refreshToken = refreshToken
                                        await userDoc.save().catch((error) => {
                                            return res.status(400).send({ error: 'Internal Server Error', status: 400 })
                                        })

                                        res.cookie('refreshToken', refreshToken, {
                                            httpOnly: process.env.NODE_ENV === 'production',
                                            secure: process.env.NODE_ENV === 'production', // Set to true in production
                                            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                                            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
                                        });
                                        res.cookie('accessToken', refreshToken, {
                                            httpOnly: process.env.NODE_ENV === 'production',
                                            secure: process.env.NODE_ENV === 'production', // Set to true in production
                                            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                                            maxAge: 24 * 60 * 60 * 1000 // 7 days expiration
                                        });
                                        let userData = user
                                        userData = _.omit(userData.toObject(), ['password'])
                                        userData.fullName = `${userData.name} ${userData.surname}`
                                        return res.status(200).send({ message: "Log In Successful", status: 200, token: accessToken, userAccount: userData })
                                    }


                                } else {
                                    return res.status(400).send({ error: 'Email/Password is Incorrect', status: 400 })
                                }


                            })
                            .catch((error) => {
                                Logbook.error(error)
                                return res.status(400).send({ error: 'Something went wrong', status: 400 })
                            })
                    } else {
                        return res.status(400).send({ error: 'user not found', status: 400 })
                    }

                })
                .catch((error) => {
                    Logbook.error(error)
                    return res.status(400).send({ error: 'user not found', status: 400 })
                })
            
        }).catch((error) => {
            Logbook.error(error)
            return res.status(500).send('Internal Server Error')
        })
    },

    googleSuccess: async (req, res) => {
        
        if(req.isAuthenticated()) {
            const user = req.user
            let payload = { _id: user._id.toString() }
            const accessToken = await generateToken(payload)
            const refreshToken = await generateRefreshToken(payload)

            res.cookie('accessToken', refreshToken, {
                httpOnly: process.env.NODE_ENV === 'production',
                secure: process.env.NODE_ENV === 'production', // Set to true in production
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: process.env.NODE_ENV === 'production',
                secure: process.env.NODE_ENV === 'production', // Set to true in production
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
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

    validateEmail: async ( req, res )  => {

        const userID = new mongoose.Types.ObjectId(req.user._id)
        let user = null

        try {
            user = await Account.findOne({ _id: userID })
        }
        catch (e) {
            Logbook.error({ error: 'User does not exist', status: 400 })
            return res.status(400).send({ error: 'User does not exist', status: 400 })
        }

        if(user.isEmailVerified) {
            return res.status(400).send({ error: 'Email is already verified', status: 400 })
        }

        if(!user.isEmailVerified) {

            const data = generateTemporaryCode({userID})
            user.resetCode = data.tempCode
            user.resetExpiry = data.expiry
            try {
                await user.save()
                await sendEmailVerification(user.email, data.tempCode)
                return res.status(200).send({ message: 'Email validation sent successfully', status: 200 })
            }
            catch (e) {
                return res.status(500).send({ error: 'Internal Server Error', status: 500 })
            }

        }

    },

    validateEmailCode: async (req, res) => {
        const { code } = req.body
        
        if(!code) {
            return res.status(400).send({ error: 'Code invalid', status: 400 })
        }

        const user = await Account.findOne({ resetCode: code })

        if(code && code !== user.resetCode ) {
            return res.status(400).send({ error: 'Invalid Code', status: 400 })
        }

        if(!user) {
            return res.status(400).send({ error: 'User not found', status: 400 })
        }

        if(user.isEmailVerified) {
            return res.status(400).send({ error: 'Email is already verified', status: 400 })
        }

        user.resetCode = null
        user.resetExpiry = null
        user.isEmailVerified = true

        await user.save()
            .then((response) => {
                return res.status(200).send({ message: 'Email has been verified successfully', status: 200 })
            })
            .catch((error) => {
                return res.status(400).send({ error: 'Email verification unsuccessful', status: 400 })
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
                    const _id = userDoc._id
                    const data = await generateTemporaryToken({ _id })
                    userDoc.tempToken = data.tempToken
                    userDoc.expiry = data.expiry
                    await userDoc.save()
                    await sendForgotPassword(userDoc.email, userDoc.tempToken)

                    Logbook.info('Email sent successfully')
                    return res.status(200).send({ message: 'Email is sent successfully', status: 200 })
                    
                } else {
                    return res.status(400).send({ error: 'Email Account is not verified', status: 400 })
                }
            })
            .catch((error) => {
                Logbook.error(error)
                return res.status(500).send({ error: error, status: 500 })
            })
        
    },

    // Change Password
    resetPassword: async (req, res) => {
        let userDoc;

        const { newPassword, token } = req.body

        await Account.findOne({ tempToken: token })
            .then(async (userDoc) => {

                if(userDoc && userDoc.resetExpiry < Date.now() ) {
                    return res.status(400).send({ error: 'Expired Token', status: 400 })
                }
                else {
                    userDoc.password = newPassword
                    userDoc.tempToken = null
                    userDoc.resetExpiry = null
                    await userDoc.save().then(() => {
                        Logbook.info('Password updated successfully')
                        return res.status(200).send({ message: 'Password has been updated successfully', status: 200 })
                    }).catch((error) => {
                        Logbook.error('Password not updated')
                        return res.status(400).send({ error: error, status: 400 })
                    })
                }

            })
            .catch(error => {
                Logbook.error(error)
                return res.status(400).send({ error: 'Password could not be changed', status: 400 })
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
    },

    twoFactorAuth: async (req, res) => {
        if(req.isAuthenticated()) {
            // check if user is authenticated
            // check if user exists
            const user = req.user
            if(user && user.twoFactorAuth) {
                Logbook.error(`${user._id}: Two Factor is already setup [ 400 ]`)
                return res.status(400).send({ error: 'Two Factor is already setup', status: 400 })
            }

            const userDoc = await Account.findOne({ _id: new mongoose.Types.ObjectId(user._id) })

            if(!userDoc) {
                Logbook.error({ error: 'User not found', status: 400 })
                return res.status(400).send({ error: 'User not found', status: 400 })
            }

            const secret = await generateTwoFactorSecret()
            const qrCodeData = await qrcode.toDataURL(secret.otpauth_url).catch((error) => {
                Logbook.error(error)
                return res.status(400).send({ error: 'Error generating QR Code', status: 400 })
            })

            if(qrCodeData) {
                userDoc.twoFactorImage = qrCodeData
                userDoc.twoFactorAuthSecret = secret.base32
                await userDoc.save().then(() => {
                    return res.status(200).send({ secureImage: qrCodeData })
                }).catch((error) => {
                    Logbook.error(error)
                    return res.status(500).send({ error: 'Internal Server Error', status: 500 })
                })

            } else {
                return res.status(400).send({ error: 'Error generating QR Code', status: 400 })
            }

        } else {
            return res.status(401).send({ error: 'Unauthorized', status: 400 })
        }
    },

    verifyTwoFactorAuth: async (req, res) => {
        if(req.isAuthenticated()) {
            
            const user = req.user
            
            await Account.findOne({ _id: user._id }) 
                .then(async (userDoc) => {
                    
                    if(!userDoc.twoFactorAuthSecret) {
                        Logbook.error('Account has not enabled 2 factor authorization.')
                        return res.status(400).send({ error: 'Account has not enabled 2 factor authorization.', status: 400 })
                    }

                    const verified = await speakeasy.totp.verify({
                        secret: userDoc.twoFactorAuthSecret,
                        encoding: 'base32',
                        token: req.body.token
                    });

                    if (verified) {
                        
                        if(!userDoc.twoFactorAuth) {
                            userDoc.twoFactorAuth = true
                            await userDoc.save()
                        }
                        Logbook.info(`${user._id}: 2FA verification successful`)
                        return res.status(200).send({ message: '2FA verification successful', status: 200 });
                    } else {
                        Logbook.error('Invalid Token')
                        return res.status(401).send({ error: 'Invalid Token', status: 400 })
                    }
                    
                })
                .catch((error) => {
                    Logbook.error(`${user._id}: User not found [ 400 ]`)
                    return res.status(400).send({ error: error, status: 400 })
                })
            
            
        } else {
            return res.status(401).send({ error: 'Unauthorized', status: 400 })
        }
    },

    validateRefreshToken: async (req, res) => {

        const { refreshToken } = req.cookies

        const user = await Account.findOne({ refreshToken: refreshToken }, { password: 0 })

        if(!user) {
            return res.status(400).send({ error: 'Invalid Token', status: 400 })
        }

        const checkTokenExpiry = await verifyToken(refreshToken)

        if(checkTokenExpiry.expired) {
            return res.status(400).send({ error: 'Token is expired, please login again.', expiry: true, status: 400 })
        }

        if(checkTokenExpiry.valid) {
            let payload = { _id: new mongoose.Types.ObjectId(user._id) }
            const accessToken = await generateToken(payload)

            res.cookie('accessToken', accessToken, {
                httpOnly: process.env.NODE_ENV === 'production',
                secure: process.env.NODE_ENV === 'production', // Set to true in production
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 7 days expiration
            });

            return res.status(200).send({ accessToken: accessToken, userData: user, status: 200 })
        } else {
            return res.status(500).send({ error: 'Internal Server Error', status: 500 })
        }

    },

    validatePhoneNumber: async (req, res) => {

        const userID = new mongoose.Types.ObjectId(req.user._id)

        const user = await Account.findOne({ _id: userID })

        if(!user) {
            return res.status(404).send({ error: 'User not found', status: 404 })
        }

        let phoneNumber = (user?.mobile_number).toString()

        if(!phoneNumber) {
            return res.status(404).send({ error: 'Phone Number is not available.', status: 404 })
        }

        // Validate UAE phone number format
        if(phoneNumber && !phoneNumber.includes('+')) {
            phoneNumber = '+' + phoneNumber
        }

        let parsedNumber = parsePhoneNumber(phoneNumber)
        if(!parsedNumber) {
            return res.status(400).send({ error: 'Invalid Phone Number', status: 400 })
        }

        let isValidNumber = parsedNumber.isValid()
        if(!isValidNumber) {
            return res.status(400).send({ error: 'Invalid Phone Number', status: 400 })
        }


        const generateSMS = generateTemporaryCode()
        const sendMessage = await sendVerificationSMS(phoneNumber, generateSMS.tempCode)

        if(!sendMessage.message_sent) {
            return res.status(400).send({ error: 'SMS send failed, please try again later', status: 400 })
        }

        try {
            user.phoneCode = generateSMS.tempCode
            user.phoneCodeExpiry = generateSMS.expiry
            await user.save()
            return res.status(200).send({ message: 'Message sent successfully', status: 200 })
        }
        catch (e) {
            return res.status(500).send({ error: 'Internal Server Error', status: 500 })
        }

    },

    verifyPhoneNumber: async (req, res) => {

        let { token, phoneNumber } = req.body

        if(!token) {
            return res.status(400).send({ error: '6 digit code is required', status: 400 })
        }

        // Validate UAE phone number format
        if(!phoneNumber.includes('+')) {
            phoneNumber = '+' + phoneNumber
        }

        let parsedNumber = parsePhoneNumber(phoneNumber)
        if(!parsedNumber) {
            return res.status(400).send({ error: 'Invalid Phone Number', status: 400 })
        }

        let isValidNumber = parsedNumber.isValid()
        if(!isValidNumber) {
            return res.status(400).send({ error: 'Invalid Phone Number', status: 400 })
        }

        const user = await Account.findOne({ phoneCode: token })

        if(!user) {
            return res.status(404).send({ error: 'Invalid Code', status: 400 })
        }

        if (Date.now() > user.phoneCodeExpiry) {
            return res.status(400).send({ error: 'Token is expired', status: 400 })
        }

        if(user.isMobileVerified) {
           return res.status(404).send({ error: 'Phone number already verified', status: 404 })
        }

        user.isMobileVerified = true
        user.phoneCodeExpiry = null
        user.phoneCode = null
        user.mobile_number = phoneNumber

        await user.save()
            .then((response) => {
                if(response) { return res.status(200).send({ message: 'Phone number verified successfully', status: 200 })}
            })
            .catch((error) => {
                Logbook.error(error)
                return res.status(400).send({ error: 'Phone Number verification failed', status: 400 })
            })
    },

    getGlobalContracts: async (req, res) => {

        try {
            const globalContracts = await GlobalContracts.find({});
            res.status(200).send({ message: 'Global Messages Retrieved Successfully', status: 200, data: globalContracts });
        } catch (error) {
            Logbook.error('Error retrieving messages:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }

    },

    changePhoneNumber: async ( req, res ) => {
        let { newPhoneNumber } = req.body // get new email
        const user = req.user

        // Validate UAE phone number format
        if(!newPhoneNumber.includes('+')) {
            newPhoneNumber = '+' + newPhoneNumber
        }

        let parsedNumber = parsePhoneNumber(newPhoneNumber)
        if(!parsedNumber) {
            return res.status(400).send({ error: 'Invalid Phone Number', status: 400 })
        }

        let isValidNumber = parsedNumber.isValid()
        if(!isValidNumber) {
            return res.status(400).send({ error: 'Invalid Phone Number', status: 400 })
        }

        const checkExistingNumber = await Account.findOne({ mobile_number: newPhoneNumber })

        if(checkExistingNumber) {
            return res.status(400).send({ error: 'PhoneNumber already in use.', status: 400 })
        }

        if(user && !user.isEmailVerified) {
            return res.status(400).send({ error: 'Account email address is not verified', status: 400 })
        }

        if(user && !user.isMobileVerified) {
            return res.status(400).send({ error: 'Current Phone Number is not verified', status: 400 })
        }

        await Account.findOne({ _id: user._id })
            .then(async (userDoc) => {

                const { tempCode, expiry } = generateTemporaryCode()
                userDoc.resetCode = tempCode
                userDoc.resetExpiry = expiry
                await userDoc.save()
                await sendChangePhoneNumber(userDoc.email, tempCode)
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


    },

    resetPhoneNumber: async ( req, res ) => {
        let { token, newPhoneNumber } = req.body

        if(!token) {
            return res.status(400).send({ error: '6 digit code is required', status: 400 })
        }

        // Validate UAE phone number format
        if(!newPhoneNumber.includes('+')) {
            newPhoneNumber = '+' + newPhoneNumber
        }

        let parsedNumber = parsePhoneNumber(newPhoneNumber)
        if(!parsedNumber) {
            return res.status(400).send({ error: 'Invalid Phone Number', status: 400 })
        }

        let isValidNumber = parsedNumber.isValid()
        if(!isValidNumber) {
            return res.status(400).send({ error: 'Invalid Phone Number', status: 400 })
        }

        const user = await Account.findOne({ resetCode: token })

        if(!user) {
            return res.status(404).send({ error: 'Invalid Code', status: 400 })
        }

        if (Date.now() > user.resetExpiry) {
            return res.status(400).send({ error: 'Token is expired', status: 400 })
        }

        user.resetCode = null
        user.resetExpiry = null
        user.mobile_number = newPhoneNumber

        await user.save()
            .then((response) => {
                if(response) { return res.status(200).send({ message: 'Phone number changed successfully', status: 200 })}
            })
            .catch((error) => {
                Logbook.error(error)
                return res.status(400).send({ error: 'Phone Number verification failed', status: 400 })
            })
    }

}

export default accountController