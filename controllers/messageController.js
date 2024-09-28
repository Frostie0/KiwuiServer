import Message from "../models/Message.js"


export const getMessageController = async (req, res) => {
    try {
        const { senderId } = req.query;

        if (!senderId) {
            return res.status(400).send({ message: "Sender ID is required" });
        }

        // Pagination des résultats
        // const page = parseInt(req.query.page) || 1;
        // const limit = parseInt(req.query.limit) || 10;
        // const skip = (page - 1) * limit;.skip(skip).limit(limit);

        const messages = await Message.find({ senderId })

        return res.status(200).send({ messages });

    } catch (error) {
        console.error("Error retrieving messages:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
};


export const getTchatController = async (req, res) => {
    try {

        const { senderId, receverId } = req.query;

        if (!senderId || !receverId) {
            return res.status(400).send({ message: "senderId and ReceverId are required" });
        }

        const messages = await Message.find({ 
            $or: [
                { senderId, receverId },
                { senderId: receverId, receverId: senderId }
            ]
        }).sort({ createdAt: 1 });


        return res.status(200).send({ messages });

    } catch (error) {
        console.error("Error retrieving messages:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
};

