import Driver from '../models/Driver.js';
import Mission from '../models/Mission.js'
import moncash from 'nodejs-moncash-sdk';
import Transaction from '../models/Transaction.js';
import Client from '../models/Client.js';
import Message from "../models/Message.js";
import { Expo } from 'expo-server-sdk';


let expo = new Expo();

moncash.configure({
    mode: process.env.MONCASH_MODE,
    client_id: process.env.MONCASH_CLIENT_ID,
    client_secret: process.env.MONCASH_CLIENT_SECRET,
});


export const getMissionsController = async (req, res) => {
    try {
        const { driverId } = req.params

        const missions = await Mission.find({})

        if (!missions || missions.length === 0) {
            return res.status(404).json({ message: "No mission found for this user" })
        }

        const missionsList = missions.filter(item => item.driverId === '' || item.driverId === driverId)

        res.status(200).json({ missionsList });

    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
};

export const takeMissionController = async (req, res) => {
    try {
        const { orderId, driverId } = req.body

        const driver = await Driver.findOne({ driverId: driverId })

        if (!driver) {
            return res.status(404).json({ message: "No driver found" });
        }

        const existingMission = await Mission.findOne({ driverId: driverId, payedDriverConfirmation: false });

        if (existingMission) {
            return res.status(400).json({ message: "Driver has already taken a mission" });
        }

        const missions = await Mission.findOne({ orderId: orderId })

        if (!missions || missions.length === 0) {
            return res.status(404).json({ message: "No mission found" })
        }

        if (missions.driverId !== '') {
            return res.status(400).json({ message: "A other Driver has already taken a mission" })
        }

        const client = await Client.findOne({ clientId: missions.clientId })

        missions.driverId = driverId;
        missions.phoneDriver = driver.phone;

        missions.profileDriver = driver.profile;
        missions.nameDriver = driver.name;
        missions.ratingDriver = driver.rating;
        missions.shippingCompletedDriver = driver.ShippingCompleted;

        driver.connected = true

        missions.save();
        driver.save();


        if (client.notificationStatut && client.tokenClient.length > 0) {

            let message = {
                to: client.tokenClient,
                sound: 'default',
                title: 'Course Acceptée',
                body: 'Votre chauffeur a accepté votre course. Il sera bientôt en route pour vous récupérer.',
                data: { withSome: 'data' },
            };

            await expo.sendPushNotificationsAsync([message]);
        }


        res.status(200).json({ missions });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error" });
    }
};

export const completeMissionController = async (req, res) => {
    try {
        const { driverId, paymentId } = req.body;

        console.log(paymentId);
        
        const driver = await Driver.findOne({ driverId });

        if (!driver) {
            return res.status(404).json({ message: "No driver found" });
        }

        const mission = await Mission.findOne({ driverId });

        if (!mission) {
            return res.status(404).json({ message: "No mission found" });
        }

        const paymentIdMission = mission.paymentId;

        if (paymentIdMission === paymentId) {
            mission.payedDriverConfirmation = true;
            mission.driverDeliveredLatitude = driver.latitude;
            mission.driverDeliveredLongitude = driver.longitude;

            const amount = Math.round(mission.price - (mission.price * 5 / 100));
            driver.balance += amount;
            driver.ShippingCompleted += 1;
            driver.connected = false;

            const transaction = await Transaction.create({
                id: driverId,
                orderId: mission.orderId,
                amount,
                statut: 'Successfully',
                typePayment: 'Wallet',
                typeTransaction: 'Mission',
                transactionId: Math.floor(0 + Math.random() * 100000000),
            });

            const senderId = driverId;
            const receiverId = mission.clientId;

            // Suppression des messages trouvés
            await Message.deleteMany({
                $or: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            });

            await driver.save();
            await mission.save();

            return res.status(200).json({ mission, driver });
        } else {
            return res.status(400).json({ message: "Payment ID does not match" });
            console.log({ message: "Payment ID does not match" })
        }

    } catch (error) {
        console.error('Error completing mission:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export const getCoordinateMissionController = async (req, res) => {
    try {
        const { driverId } = req.params

        console.log(driverId)

        const missions = await Mission.findOne({ driverId: driverId })
        const driver = await Driver.findOne({ driverId })

        if (!missions || missions.length === 0) {
            return res.status(404).json({ message: "No mission found for this user" })
        }

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" })
        }

        const driverLatitude = driver.latitude;
        const driverLongitude = driver.longitude;

        const pickupLatitude = missions.pickupLatitude;
        const pickupLongitude = missions.pickupLongitude;

        const deliveredLatitude = missions.deliveredLatitude;
        const deliveredLongitude = missions.deliveredLongitude;

         const price = missions.price;
        const distance = missions.distance;
        const duration = missions.duration;

        res.status(200).json({ driverLatitude: driverLatitude, driverLongitude: driverLongitude, pickupLatitude: pickupLatitude,
                              pickupLongitude: pickupLongitude, deliveredLatitude: deliveredLatitude, deliveredLongitude: deliveredLongitude,
                              price : price , distance: distance , duration : duration });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error" });
    }
};

export const getCoordinateMissionClientController = async (req, res) => {
    try {
        const { orderId } = req.params

        const missions = await Mission.findOne({ orderId })

        if (!missions || missions.length === 0) {
            return res.status(404).json({ message: "No mission found for this client" })
        }

        const pickupLatitude = missions.pickupLatitude;
        const pickupLongitude = missions.pickupLongitude;
        const pickupAddress = missions.pickupAddress;

        const deliveredLatitude = missions.deliveredLatitude;
        const deliveredLongitude = missions.deliveredLongitude;
        const deliveredAddress = missions.deliveredAddress;

        const price = missions.price;
        const distance = missions.distance;
        const duration = missions.duration;

        const clientId = missions.clientId;


        res.status(200).json({ clientId: clientId, pickupAddress: pickupAddress, deliveredAddress: deliveredAddress, pickupLatitude: pickupLatitude, 
                              pickupLongitude: pickupLongitude, deliveredLatitude: deliveredLatitude, deliveredLongitude: deliveredLongitude ,
                             price : price , distance: distance , duration : duration });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error" });
    }
};

export const getPageController = async (req, res) => {
    try {
        const { orderId } = req.params

        const missions = await Mission.findOne({ orderId })

        if (!missions || missions.length === 0) {
            return res.status(403).json({ message: "No mission found for this client" })
        }

        if (!missions.verifiedPickup && !missions.verifiedDelivered && !missions.payed) {
            return res.status(200).json({ message: "order begin" })
        }

        if (!missions.payed && missions.verifiedPickup && !missions.verifiedDelivered) {
            return res.status(203).json({ message: "order pickup" })
        }

        if (missions.verifiedPickup && missions.verifiedDelivered && !missions.payed) {
            return res.status(201).json({ message: "order delivered" })
        }

        if (missions.payed && missions.verifiedPickup && missions.verifiedDelivered) {
            return res.status(202).json({ message: "order payed" })
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error" });
    }
};

export const confirmMissionDeliveredAddress = async (req, res) => {
    try {
        const { orderId } = req.params
        const { latitude, longitude, addressDelivered , price , duration , distance } = req.body

        const mission = await Mission.findOne({ orderId })

        if (!mission) {
            return res.status(404).send({ Message: "Mission not find" })
        }

        mission.deliveredLatitude = latitude;
        mission.deliveredLongitude = longitude;
        mission.deliveredAddress = addressDelivered;
        mission.distance = distance;
        mission.duration = duration;
        mission.price = price;
        mission.verifiedDelivered = true;

        function deg2rad(deg) {
            return deg * (Math.PI / 180);
        }

     await mission.save()

        res.status(200).send({ Message: "Mission update succesfully" })

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "Error confirm address" })
    }
};

export const confirmMissionPickupAddress = async (req, res) => {
    try {
        const { orderId } = req.params
        const { latitude, longitude, addressPickup } = req.body

        const mission = await Mission.findOne({ orderId })

        if (!mission) {
            return res.status(404).send({ Message: "Mission not find" })
        }

        mission.pickupLatitude = latitude;
        mission.pickupLongitude = longitude;
        mission.pickupAddress = addressPickup;
        mission.verifiedPickup = true;

        await mission.save()

        res.status(200).send({ Message: "Mission update succesfully" })

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "Error confirm address" })
    }
};

export const updateAddressMissionController = async (req, res) => {
    try {
        const { orderId } = req.params
        const { address, addressType } = req.body

        console.log(address)
        console.log(addressType)

        const mission = await Mission.findOne({ orderId })

        if (!mission) {
            return res.status(404).send({ Message: "Mission not find" })
        }

        if (addressType === 'pickup') {
            mission.pickupAddress = address;
        }

        if (addressType === 'delivered') {
            mission.deliveredAddress = address;
        }


        await mission.save()


        res.status(200).send({ Message: "Mission update succesfully" })

        console.log(mission)

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "Error confirm address" })
    }
};

export const moncashClientPaymentController = async (req, res) => {
    try {
        const { price, orderId, nbresPassager } = req.body;

        const mission = await Mission.findOne({ orderId });

        if (!mission) {
            return res.status(404).json({ message: "Mission n'existe pas" });
        }

        const clientId = mission.clientId

        const client = await Client.findOne({ clientId });

        if (!client) {
            return res.status(404).json({ message: "Client n'existe pas" });
        }

        if (client.balance < price) {
            return res.status(403).json({ message: "Votre solde n'est pas suffisant" });
        }

        client.balance -= Math.round(price * nbresPassager);

        mission.payed = true;

        mission.price = Math.round(price * nbresPassager);

        mission.nbresPassager = nbresPassager;

        const transaction = await Transaction.create({
            id: clientId, orderId: orderId, amount: -Math.round(price * nbresPassager), statut: 'Successfully'
            , typePayment: 'Wallet', typeTransaction: 'Mission', transactionId: Math.floor(0 + Math.random() * 100000000),
        });

        await client.save();
        await mission.save();

        res.status(200).json({ message: "Paiement effectué" });

    } catch (error) {
        console.log("Erreur lors de la sauvegarde des données :", error);
        res.status(500).json({ message: "Erreur lors du paiement" });
    }
};


// export const moncashClientPaymentController = async (req, res) => {
//     try {

//         const userId = req.body.userId;
//         const typePayment = req.body.typePayment;
//         const typeTransaction = req.body.typeTransaction;
//         const statut = req.body.statut;
//         const amount = req.body.amount;
//         const orderId = req.body.orderId;
//         const transactionId = req.body.transactionId;

//         const create_payment_json = {
//             amount: req.body.amount,
//             orderId: req.body.orderId,
//         };

//         const payment_creator = moncash.payment;
//         payment_creator.create(create_payment_json, async function (err, payment) {
//             if (err) {
//                 console.log(err);
//                 return res.status(500).json({
//                     error: err,
//                 });
//             } else {

//                 res.status(200).json(payment_creator.redirect_uri(payment));
//             }
//         });

//         const existingTransaction = await Transaction.findOne({ orderId })

//         if (existingTransaction) {
//             return res.status(400).json({ message: "Transaction already registered" });
//         }

//         const transaction = await Transaction.create({
//             userId, orderId, amount, statut
//             , typePayment, typeTransaction, transactionId,
//         });


//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "payment not send" })
//     }
// };

export const moncashTransactionController = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        moncash.capture.getByOrderId(orderId, async function (err, data) {
            if (err) {

                const transaction = await Transaction.findOne({ orderId })

                if (!transaction) {
                    return res.status(400).json({ message: "Transaction not find" });
                } else {
                    if (err.response.status === 404) {
                        transaction.statut = "Failed"
                    }
                    await transaction.save()
                }

                const status = err.response.status

                return res.status(500).json({
                    error: err, status
                });

            } else {
                const payment = data.payment
                const number = payment.payer

                const user = await User.findOne({ number })

                if (!user) {
                    return res.status(404).json({ message: "Utilisateur non trouvé" });
                }

                if (data.status === 200) {
                    user.balance += payment.cost;
                    await user.save();
                }

                const transaction = await Transaction.findOne({ orderId })

                if (!transaction) {
                    return res.status(400).json({ message: "Transaction not find" });
                } else {
                    if (data.status === 200) {
                        transaction.statut = "Successfully"
                    }
                    await transaction.save()
                }

                const status = data.status

                res.status(200).json({ moncash: data, user: user, transaction: transaction, status });
            }
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "history not send" })
    }
};
