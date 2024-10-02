import { Server } from 'socket.io';
import Driver from '../models/Driver.js';
import Mission from '../models/Mission.js';
import Message from '../models/Message.js';
import { Expo } from 'expo-server-sdk';
import Client from '../models/Client.js';

let expo = new Expo();

const WebSocketServer = () => {

    const io = new Server({
    cors: {
        origin: "http://localhost:3000", // Remplace par l'URL de ton site web
        methods: ["GET", "POST"]
    }
});
io.listen(4000);
    
    const connectedUsers = new Set();
    

    io.on('connection', (socket) => {

        console.log('Client connected');

        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
        });

        socket.on('sendLocation', async (data) => {
            try {
                const { id, latitude, longitude, roomId } = data

                console.log(data);

                function deg2rad(deg) {
                    return deg * (Math.PI / 180);
                }

                function haversine(lat1, lon1, lat2, lon2) {
                    const earthRadius = 6371;
                    const dLat = deg2rad(lat2 - lat1);
                    const dLon = deg2rad(lon2 - lon1);

                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                    const distance = earthRadius * c;

                    return distance;
                }

                let driver = await Driver.findOneAndUpdate(
                    { driverId: id },
                    { $set: { latitude, longitude } },
                    { upsert: true, new: true }
                );

                console.log(data)

                io.to(roomId).emit('receiveLocation', driver);

                // const missionClient = await Mission.findOne({
                //     driverId : id,
                // });

                // io.to(roomId).emit('missionClient', missionClient);

                const missions = await Mission.find({
                    $or: [
                        { driverId: '' },
                        { driverId: id }
                    ],
                    payed: true,
                    payedDriverConfirmation: false
                });


                io.emit('missions', missions.filter((mission) => {
                    const distance = haversine(latitude, longitude, mission.pickupLatitude, mission.pickupLongitude);
                    return distance <= 5
                }));



            } catch (error) {
                console.log('Erreur lors de la gestion de la location :', error);
            }
        });

        socket.on('userConnected', (userId) => {
            connectedUsers.add(userId);
            console.log('User connected:', connectedUsers);
        });

        socket.on('userDisconnected', (userId) => {
            connectedUsers.delete(userId);
            console.log('User disconnected:', connectedUsers);
        });

        socket.on('sendMessage', async (data) => {
            try {
                const { senderId, receverId, message, type, receverType } = data;

                let messagesData = await Message.findOneAndUpdate(
                    { senderId, receverId },
                    { $push: { messages: { message, sender: senderId, type } } },
                    { upsert: true, new: true }
                );

                if (receverType === 'Client') {

                    const client = await Client.findOne({ clientId: receverId })

                    if (!connectedUsers.has(receverId) && client.notificationStatut && client.tokenClient.length > 0) {

                        let messageContent = {
                            to: client.tokenClient,
                            sound: 'default',
                            title: 'Votre chauffeur',
                            body: message,
                            data: { withSome: 'data' },
                        };

                        await expo.sendPushNotificationsAsync([messageContent]);
                    }

                }

                if (receverType === 'Driver') {

                    const driver = await Driver.findOne({ driverId: receverId })

                    if (!connectedUsers.has(receverId) && driver.notificationStatut && driver.tokenClient.length > 0) {

                        let messageContent = {
                            to: driver.tokenClient,
                            sound: 'default',
                            title: 'Votre Client',
                            body: message,
                            data: { withSome: 'data' },
                        };

                        await expo.sendPushNotificationsAsync([messageContent]);
                    }

                }



                io.to(receverId).emit('receiveMessage', messagesData);

            } catch (error) {
                console.log('Erreur lors de la gestion du message :', error);
            }
        });

        socket.on('disconnect', () => console.log('Client disconnected'));
    });


};

export default WebSocketServer;





// const server = http.createServer();
// const io = new Server(server);

// const PORT = process.env.WEBSOCKET_PORT || 8080;
// server.listen(PORT, () => {
//     console.log(`Le serveur WebSocket est en cours d'exécution sur le port ${PORT}`);
// });

// io.on('connection', (socket) => {
//         console.log('Un utilisateur est connecté');

//         socket.on('sendMessage', async (data) => {
//             try {
//                 const { userId, sellerId, message } = data;

//                 // Recherche du document de message correspondant ou création d'un nouveau
//                 let messages = await Message.findOneAndUpdate(
//                     { userId, sellerId },
//                     { $push: { messages: { message, sender: userId } } },
//                     { upsert: true, new: true }
//                 );

//                 // Émettre le message au destinataire
//                 io.to(sellerId).emit('receiveMessage', messages.message);
//             } catch (error) {
//                 console.log('Erreur lors de la gestion du message :', error);
//             }
//         });

//         socket.on('disconnect', () => {
//             console.log('L\'utilisateur s\'est déconnecté');
//         });
//     });
