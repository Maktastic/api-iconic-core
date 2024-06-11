import mongoose from "mongoose";
import Account from '../../schemas/accountSchema.js'
import Logbook from "../../config/logger.js";
import AWS from '../../config/aws.js'
import GlobalContracts from "../../schemas/globalContractsSchema.js";


const documentController = {

    updateStatus: async ( req, res ) => {
        const docType = req.params.docType;
        const customerID = new mongoose.Types.ObjectId(req.user._id)
        const newStatus = req.body.status;

        if(!['passport', 'kyc', 'utility_bills', 'id'.includes(docType)]) {
            return res.status(400).send({ error: 'Invalid type', status: 400})
        }

        if(!['pending', 'approved', 'denied'].includes(newStatus)) {
            return res.status(400).send({ error: 'Invalid status type', status: 400 })
        }

        if(!newStatus) {
            return res.status(400).send({ error: 'status field is mandatory', status: 400 })
        }

        const account = await Account.findOne({ _id: customerID });

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        if (!account?.documents.hasOwnProperty(docType)) {
            return res.status(404).json({ message: `Document type ${docType} not found` });
        }

        account.documents[docType].status = newStatus;
        await account.save()
            .then(() => {
                return res.status(200).send({ message: 'Document status updated successfully', status: 200 })
            })
            .catch(error => {
                Logbook.error({ error: 'Document status updated unsuccessfully', status: 400 })
                return res.status(400).send({ error: 'Document status updated unsuccessfully', status: 400 })
            })

    },

    viewDocument: async (req, res) => {

        try {
            const { docType } = req.params

            const user = req.user

            const account = await Account.findOne({ customerID: user.customerID })

            if(!account) {
                return res.status(400).send({ error: "Account not found", status: 400 })
            }

            if (!account.documents.hasOwnProperty(docType)) {
                return res.status(404).json({ error: `Document type ${docType} not found`, status: 404 });
            }

            const document = account.documents[docType];
            if (!document.pathUrl) {
                return res.status(404).json({ error: 'Document not found', status: 404 });
            }

            const userID = account._id;
            const fileName = account.documents[docType].fileName;
            const key = `secure-documents/${userID}/${encodeURIComponent(fileName)}`;

            const params = {
                Bucket: 'iconic-core-users-bucket',
                Key: key,
                Expires: 60 // URL expiration time in seconds
            };
            const s3 = new AWS.S3()
            const url = s3.getSignedUrl('getObject', params);

            return res.status(200).send({ viewDocument: url })
        }
        catch (e) {
            Logbook.error({ error: e, status: 400 })
            res.status(400).send({ error: 'Internal Server Error', status: 400 })
        }

    },

    uploadGlobalContracts: async ( req, res ) => {

        const { title, description } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).send({ error: 'No file uploaded' });
        }

        try {

            let params = {
                Bucket: 'global-contracts-dev',
                Key: `global-contracts_${file.originalname}`, // Folder structure in the bucket
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'private', // Ensure the file is not publicly accessible
            };

            let s3 = new AWS.S3();
            await s3.upload(params).promise();

            const newContract = new GlobalContracts({ title, description, fileName: file.originalname, createdBy: req.user._id });
            await newContract.save();
            res.status(200).send({ contract: newContract, status: 200 });
        } catch (error) {
            Logbook.error('Error uploading file to S3:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    },

    getAllContracts: async ( req, res ) => {
        try {
            const globalContracts = await GlobalContracts.find({});
            res.status(200).send({ message: 'Global Messages Retrieved Successfully', status: 200, data: globalContracts });
        } catch (error) {
            Logbook.error('Error retrieving messages:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }
    }

}

export default documentController