import GlobalMessages from "../../schemas/globalMessagesSchema.js";
import Logbook from "../../config/logger.js";


const messageController = {

    getMessages: async ( req, res) => {
        try {
            const globalMessages = await GlobalMessages.find({});

            res.status(200).send({ message: 'Global Messages Retrieved Successfully', status: 200, data: globalMessages });
        } catch (error) {
            console.error('Error retrieving messages:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }
    },

    uploadMessages: async ( req, res ) => {

        const { title, description } = req.body;

        if (!title) {
            return res.status(400).send({ error: 'Title is required', status: 400 });
        }

        try {
            const globalMessage = await GlobalMessages.create({
                title,
                description,
                createdBy: req.user._id,
            });

            res.status(201).send({ message: 'Global Message Added Successfully', status: 201, data: globalMessage });
        } catch (error) {
            Logbook.error('Error uploading message:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }

    },

    updateMessages: async (req, res) => {
        const { messageID } = req.params;
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).send({ error: 'Title is required', status: 400 });
        }

        try {
            const globalMessage = await GlobalMessages.findByIdAndUpdate(
                messageID,
                { title, description },
                { new: true }
            );

            if (!globalMessage) {
                return res.status(404).send({ error: 'Global Message not found', status: 404 });
            }

            res.status(200).send({ message: 'Global Message Updated Successfully', status: 200, data: globalMessage });
        } catch (error) {
            console.error('Error updating message:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }
    }

}

export default messageController