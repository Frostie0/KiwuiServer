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

        // Rechercher les messages correspondant à la conversation
       const messagesData = await Message.find({ 
            $or: [
                { senderId, receverId },
                { senderId: receverId, receverId: senderId }
            ]
        })
        // Aplatir les messages pour obtenir un tableau unique de messages
        const messages = messagesData.flatMap(message => message.messages || []);

        // Trier les messages par timestamp
        const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return res.status(200).send({ messages: sortedMessages });

    } catch (error) {
        console.error("Error retrieving messages:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
};


// export const getTchatController = async (req, res) => {
//     try {
//         const { senderId, receverId } = req.query;

//         if (!senderId || !receverId) {
//             return res.status(400).send({ message: "senderId and receiverId are required" });
//         }

//         // Créer une clé de conversation unique
//         const conversationId = [senderId, receverId].sort().join('-');

//         const messagesData = await Message.findOne({ conversationId });

//         if (!messagesData) {
//             return res.status(200).send({ messages: [] }); // Pas de messages trouvés
//         }

//         // Trier les messages par timestamp
//         const sortedMessages = messagesData.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

//         return res.status(200).send({ messages: sortedMessages });
        
//     } catch (error) {
//         console.error("Error retrieving messages:", error);
//         return res.status(500).send({ message: "Internal Server Error" });
//     }
// };

