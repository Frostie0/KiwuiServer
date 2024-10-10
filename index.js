// Import des dépendances
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { Server } from 'socket.io';  // Import de Socket.IO
import http from 'http';  // Import du module http pour créer un serveur

// Import des modèles et autres dépendances Socket.IO
import Driver from './models/Driver.js';  // Chemin modifié pour correspondre à la structure
import Mission from './models/Mission.js';
import Message from './models/Message.js';
import Client from './models/Client.js';
import { Expo } from 'expo-server-sdk';
let expo = new Expo();

// Configurer dotenv et la connexion à la base de données
dotenv.config();
connectDB();

// Initialiser l'application Express
const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(cors());
app.use(cookieParser());

// Import des routes
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import OTPRoutes from './routes/OTPRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import missionRoutes from './routes/missionRoutes.js';
import clientRoutes from './routes/clientRoutes.js';

// Routes API
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/seller", sellerRoutes);
app.use("/api/v1/driver", driverRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/OTP", OTPRoutes);
app.use("/api/v1/address", addressRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/alert", alertRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/promo", promoRoutes);
app.use("/api/v1/mission", missionRoutes);
app.use("/api/v1/client", clientRoutes);

// Créer un serveur HTTP à partir de l'application Express
const server = http.createServer(app);

// Initialiser Socket.IO avec le serveur HTTP
const io = new Server(server, {
    cors: {
        origin: "*",  // Remplacer par ton domaine en production
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// WebSocket logique
 const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('Client connecté:', socket.id);

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Client ${socket.id} a rejoint la salle ${roomId}`);
    });

    socket.on('sendLocation', async (data) => {
        try {
            const { id, latitude, longitude, roomId } = data;
            // console.log('Localisation reçue:', data);

            function deg2rad(deg) {
                return deg * (Math.PI / 180);
            }

            function haversine(lat1, lon1, lat2, lon2) {
                const earthRadius = 6371;  // Rayon de la Terre en kilomètres
                const dLat = deg2rad(lat2 - lat1);
                const dLon = deg2rad(lon2 - lon1);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return earthRadius * c;
            }

            const driver = await Driver.findOneAndUpdate(
                { driverId: id },
                { $set: { latitude, longitude } },
                { upsert: true, new: true }
            );

            io.to(roomId).emit('receiveLocation', driver);

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
                return distance <= 5 || mission.driverId === id;
            }));
        } catch (error) {
            console.log('Erreur lors de la gestion de la localisation:', error);
        }
    });

      socket.on('fetchMission', async (data) => {
        try {
            const { orderId } = data;
            
            const mission = await Mission.findOne({ orderId: orderId });

            // io.emit('sendDriverMission', mission.map((item) => {
            //     return{
            //         item.driverMap
            //     }
            // }));
            
        } catch (error) {
            console.log('Erreur lors de la gestion de la localisation:', error);
        }
    });

    socket.on('userConnected', (userId) => {
        connectedUsers.set(userId, socket.id); // Associer userId à socket.id
        console.log('Utilisateur connecté:', userId, 'Utilisateurs connectés:', connectedUsers);
    });

    // Gestion de la déconnexion de l'utilisateur
    socket.on('disconnect', () => {
        // Trouver l'utilisateur déconnecté par son socket.id
        for (let [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId); // Supprimer l'utilisateur déconnecté
                console.log('Utilisateur déconnecté:', userId, 'Utilisateurs connectés:', connectedUsers);
                break;
            }
        }
    });

    // Envoi de message
    socket.on('sendMessage', async (data) => {
        try {
            const { senderId, receverId, message, type, receverType } = data;

            let conversationId;

            // Définir conversationId en fonction du type de receveur
            if (receverType === 'Client') {
                conversationId = [receverId, senderId].sort().join('-'); // Pour les clients, on inverse l'ordre
            } else if (receverType === 'Driver') {
                conversationId = [senderId, receverId].sort().join('-'); // Pour les conducteurs, on laisse l'ordre tel quel
            }

            let messagesData = await Message.findOneAndUpdate(
                { conversationId },
                { senderId, receverId,
                $push: { messages: { message, sender: senderId, type } } },
                { upsert: true, new: true }
            );

            // Envoyer une notification push si le récepteur est un client et non connecté
            if (receverType === 'Client') {
                const client = await Client.findOne({ clientId: receverId });

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

            // Envoyer une notification push si le récepteur est un conducteur et non connecté
            if (receverType === 'Driver') {
                const driver = await Driver.findOne({ driverId: receverId });

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

            // Trouver le socketId correspondant au receverId
            const socketId = connectedUsers.get(receverId);
            if (socketId) {
                // Envoyer le message au socketId correspondant
                io.to(socketId).emit('receiveMessage', messagesData);
            } else {
                console.log('Le récepteur n\'est pas connecté');
            }

        } catch (error) {
            console.log('Erreur lors de la gestion du message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client déconnecté:', socket.id);
    });
});

// Définir le port
const PORT = process.env.PORT || 8000;

// Démarrer le serveur (API + WebSocket sur le même port)
server.listen(PORT, () => {
    console.log(`Le serveur fonctionne sur le port ${PORT}`);
});

//home
app.get("/", (req,res)=>{
  res.status(200).send({
    "msg":"Node Server Runing"
  })
})
