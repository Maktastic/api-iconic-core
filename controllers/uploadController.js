import AWS from '../config/aws.js'
import Logbook from "../config/logger.js";
import _ from "lodash";
import Account from '../schemas/accountSchema.js'

const uploadController = {
    uploadDocuments: async (req, res) => {
        if(req.isAuthenticated()) {
            const s3 = new AWS.S3();
            const userID = req?.user._id.toString();
            const files = req?.files;
            const { type } = req?.body
            let filename = ''


            // check if uploaded files are present
            if(!req?.files || req?.files?.length === 0) {
                Logbook.error('Uploaded File is missing.')
                return res.status(400).send({ error: 'Uploaded File is missing.', status: 400 })
            }

            // check if user is authenticated
            if(!req?.user) {
                Logbook.error('Unauthorized Access')
                return res.status(401).send({ error: 'Unauthorized Access', status: 400 })
            }

            // check if email is validated
            if(!req.user.isEmailVerified) {
                Logbook.error('Email validation is pending')
                return res.status(400).send({ error: 'Email validation is pending', status: 400 })
            }

            if(req.user.documents[type]?.pathUrl && _.size(req.user.documents[type]?.pathUrl) !== 0) {
                return res.status(400).send({ error: 'Document has already been submitted', status: 400 })
            }

            await Account.findOne({ customerID: req.user.customerID })
                .then(async (userDoc) => {
                    if (['passport', 'id', 'kyc', 'utility_bills'].includes(type)) {
                        const uploadPromises = await files.map(file => {
                            filename = `${type}-${file.originalname}`
                            const params = {
                                Bucket: 'iconic-core-users-bucket',
                                Key: `secure-documents/${userID}/${type}-${file.originalname}`,
                                Body: file.buffer,
                                ContentType: file.mimetype
                            };
                            return s3.upload(params).promise();
                        })

                        await Promise.all(uploadPromises).then(async (response) => {

                            if(response && _.size(response) !== 0) {

                                userDoc.documents[type] = {fileName: filename ,pathUrl: response[0]?.Location, status: 'pending' }

                                await userDoc.save()
                                    .then(() => {
                                        return res.status(200).send({ message: 'Files uploaded successfully', status: 200 })
                                    })
                                    .catch((error) => {
                                        Logbook.error(error)
                                        return res.status(500).send({ error: 'Error uploading files or updating database' });
                                    })
                            }
                        }).catch((error) => {
                            Logbook.error(error)
                            return res.status(400).send({ error: 'Error uploading files', status: 400 })
                        })
                    } else {
                        Logbook.error('type field is invalid')
                        return res.status(400).send({ error: `type field is invalid: ${type}`, status: 400 })
                    }
                })
                .catch((error) => {
                    Logbook.error(error)
                    return res.status(401).send({ error: 'User not found', status: 401 })
                })

        } else {
            return res.status(401).send({ error: 'Unauthorized Access', status: 401 })
        }
    }
}

export default uploadController