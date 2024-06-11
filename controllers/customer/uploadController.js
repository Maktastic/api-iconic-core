import AWS from '../../config/aws.js'
import Logbook from "../../config/logger.js";
import _ from "lodash";
import Account from '../../schemas/accountSchema.js'
import UserContract from "../../schemas/userContractsSchema.js";

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

            // if(req.user.documents[type]?.pathUrl && _.size(req.user.documents[type]?.pathUrl) !== 0) {
            //     return res.status(400).send({ error: 'Document has already been submitted', status: 400 })
            // }

            await Account.findOne({ customerID: req.user.customerID })
                .then(async (userDoc) => {
                    if (['passport', 'id', 'kyc', 'utility_bills'].includes(type)) {
                        const uploadPromises = await files.map(file => {
                            filename = `${type}-${encodeURIComponent(file.originalname)}`
                            const params = {
                                Bucket: 'iconic-core-users-bucket',
                                Key: `secure-documents/${userID}/${type}-${encodeURIComponent(file.originalname)}`,
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
    },
    getDocuments: async (req, res) => {
        try {
            const userID = req.user._id;

            if (!userID) {
                return res.status(400).send('User ID is required');
            }

            const params = {
                Bucket: 'iconic-core-users-bucket',
                Prefix: `secure-documents/${userID}/`,
            };
            const s3 = new AWS.S3()
            const data = await s3.listObjectsV2(params).promise();

            if (!data.Contents.length) {
                return res.status(404).send('No documents found');
            }

            const files = data.Contents.map(item => ({
                name: decodeURIComponent(item.Key.split('/').pop()),
                size: item.Size,
                lastModified: item.LastModified,
                type: item.Key.split('/').pop().split('-')[0]
            }));
            return res.status(200).send({ documents: files });
        } catch (error) {
            console.error(error);
            let errorMessage = 'Error fetching files from S3';

            if (error.code === 'NoSuchBucket') {
                errorMessage = 'Bucket does not exist';
            } else if (error.code === 'AccessDenied') {
                errorMessage = 'Access denied to the bucket';
            } else if (error.code === 'CredentialsError') {
                errorMessage = 'Invalid AWS credentials';
            }

            return res.status(500).send(errorMessage);
        }
    },

    uploadContract: async ( req, res ) => {
        const { title, description } = req.body;
        const user = req.user
        const file = req.file;
        if (!title || !file) {
            return res.status(400).send({ error: 'Title / file are required', status: 400 });
        }

        if(!user) {
            return res.status(404).send({ error: 'User does not exist', status: 404 })
        }

        try {
            const s3 = new AWS.S3()
            const params = {
                Bucket: 'customer-contracts-dev',
                Key: `${user._id}/signed-contract_${file.originalname}`, // Folder structure in the bucket
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'private', // Ensure the file is not publicly accessible
            };
            const data = await s3.upload(params).promise();
            if(data.Location) {
                const s3Url = data.Location
                const contract = await UserContract.create({
                    title,
                    description,
                    s3Url,
                    fileName: file.originalname,
                    createdBy: user._id,
                    status: 'pending'
                });
                res.status(201).send({ message: 'Contract Created Successfully', status: 201, data: contract });
            } else {
                return res.status(400).send({ error: 'Upload failure, try again later', status: 400 })
            }

        } catch (error) {
            console.error('Error creating contract:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }
    },

    getUserContracts: async ( req, res ) => {
        try {
            const contracts = await UserContract.find({ createdBy: req.user._id });
            const s3 = new AWS.S3()
            // Generate pre-signed URLs for each contract
            const contractsWithUrls = await Promise.all(
                contracts.map(async (contract) => {
                    const params = {
                        Bucket: 'customer-contracts-dev',
                        Key: `${req.user._id}/signed-contract_${contract.fileName}`,
                        Expires: 240, // Configured expiration time
                    };

                    const url = s3.getSignedUrl('getObject', params);
                    return {
                        ...contract.toObject(),
                        downloadUrl: url,
                    };
                })
            );

            res.status(200).send({ message: 'User Contracts Retrieved Successfully', status: 200, data: contractsWithUrls });
        } catch (error) {
            console.error('Error retrieving user contracts:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }
    }
}

export default uploadController