import Alert from "../models/Alert.js"
import Client from "../models/Client.js";
import Driver from "../models/Driver.js";
import Mission from "../models/Mission.js";
import User from "../models/user.js";
import { Expo } from 'expo-server-sdk';


let expo = new Expo();


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

    return distance * 1000;
}

export const postAlert = async (req, res) => {
    try {
        const { latitude, longitude, title, description, alertId, userId } = req.body;

        if (!latitude || !longitude || !title || !alertId) {
            return res.status(400).send({ message: "Valeurs requises manquantes" });
        }

        const alerts = await Alert.find();

        const alertsFiltered = alerts.filter((item) => item.title === title);
        
        const distanceLimits = {
            "Tir": 400,
            "Kidnapping": 600,
            "Blocked": 100
        };
        
        for (let existingAlert of alertsFiltered) {
            const distance = haversine(
                latitude, longitude,
                existingAlert.coordinate.latitude, existingAlert.coordinate.longitude
            );
        
            // Vérifiez si le titre existe dans les limites de distance
            if (distanceLimits[title] && distance <= distanceLimits[title]) {
                return res.status(409).send({ message: `Une alerte de type '${title}' existe déjà à l'intérieur de ${distanceLimits[title]} mètres des coordonnées fournies` });
            }
        }
        
        const alert = await Alert.findOne({ alertId });

        if (!alert) {
            const newAlert = new Alert({
                userId: userId,
                alertId: alertId,
                title: title,
                description: description,
                coordinate: {
                    latitude: latitude,
                    longitude: longitude
                }
            });

            const mission = await Mission.find({});

            for (const item of mission) {
                const { payedDriverConfirmation, clientId, driverId, deliveredLatitude, deliveredLongitude } = item;

                const distance = haversine(
                    latitude, longitude, deliveredLatitude, deliveredLongitude
                );

                if (distance <= 300) {
                    if (payedDriverConfirmation === false) {
                        const client = await Client.findOne({ clientId: clientId })

                        if (client.notificationStatut && client.tokenClient.length > 0) {
                            let message = {
                                to: client.tokenClient,
                                sound: 'default',
                                title: title,
                                body: "Une nouvelle alerte a été créée près de votre lieu d'arrivée.",
                                data: { withSome: 'data' },
                            };

                            await expo.sendPushNotificationsAsync([message]);
                        }

                        if (driverId !== '') {
                            const driver = await Driver.findOne({ driverId: driverId })

                            if (driver.notificationStatut && driver.tokenClient.length > 0) {
                                let message = {
                                    to: driver.tokenClient,
                                    sound: 'default',
                                    title: title,
                                    body: "Une nouvelle alerte a été créée près de votre lieu d'arrivée.",
                                    data: { withSome: 'data' },
                                };

                                await expo.sendPushNotificationsAsync([message]);
                            }
                        }
                    }
                }
            }

            await newAlert.save();

            return res.status(201).send({ message: "Alerte créée", newAlert });
        } else {
            return res.status(409).send({ message: "Une alerte avec cet ID existe déjà" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "L'alerte n'a pas pu être envoyée" });
    }
};



export const getAlert = async (req, res) => {
    try {
        const alertMarker = await Alert.find({})

        res.status(200).send({ alertMarker })

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "Alert not find" })
    }
}

export const updateLikeCommentary = async (req, res) => {
    try {
        const { alertId, commentId, userId } = req.body;

        const alert = await Alert.findOne({ alertId });

        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        const alertComment = alert.commentary.find(item => item.commentId === commentId);

        if (!alertComment) {
            return res.status(404).json({ message: "Commentary not found" });
        }

        const likesSet = new Set(alertComment.likes);
        const dislikesSet = new Set(alertComment.dislikes);

        if (dislikesSet.has(userId)) {
            dislikesSet.delete(userId);
        }

        if (likesSet.has(userId)) {
            likesSet.delete(userId);
        } else {
            likesSet.add(userId);
        }

        alertComment.likes = Array.from(likesSet);
        alertComment.dislikes = Array.from(dislikesSet);

        await alert.save();

        res.status(200).json({ message: "Commentary like updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const updateDislikeCommentary = async (req, res) => {
    try {
        const { alertId, commentId, userId } = req.body;

        const alert = await Alert.findOne({ alertId });

        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        const alertComment = alert.commentary.find(item => item.commentId === commentId);

        if (!alertComment) {
            return res.status(404).json({ message: "Commentary not found" });
        }

        const likesSet = new Set(alertComment.likes);
        const dislikesSet = new Set(alertComment.dislikes);

        if (likesSet.has(userId)) {
            likesSet.delete(userId);
        }

        if (dislikesSet.has(userId)) {
            dislikesSet.delete(userId);
        } else {
            dislikesSet.add(userId);
        }

        alertComment.likes = Array.from(likesSet);
        alertComment.dislikes = Array.from(dislikesSet);

        await alert.save();

        res.status(200).json({ message: "Commentary dislike updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const updateLike = async (req, res) => {
    try {
        const { alertId, userId } = req.body;

        const alert = await Alert.findOne({ alertId });

        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        const likesSet = new Set(alert.likes);
        const dislikesSet = new Set(alert.dislikes);

        if (dislikesSet.has(userId)) {
            dislikesSet.delete(userId);
        }

        if (likesSet.has(userId)) {
            likesSet.delete(userId);
        } else {
            likesSet.add(userId);
        }

        alert.likes = Array.from(likesSet);
        alert.dislikes = Array.from(dislikesSet);

        await alert.save();

        res.status(200).json({ message: "Alert like updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const updateDislike = async (req, res) => {
    try {
        const { alertId, userId } = req.body;

        const alert = await Alert.findOne({ alertId });

        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        const likesSet = new Set(alert.likes);
        const dislikesSet = new Set(alert.dislikes);

        if (likesSet.has(userId)) {
            likesSet.delete(userId);
        }

        if (dislikesSet.has(userId)) {
            dislikesSet.delete(userId);
        } else {
            dislikesSet.add(userId);
        }

        alert.likes = Array.from(likesSet);
        alert.dislikes = Array.from(dislikesSet);

        await alert.save();

        res.status(200).json({ message: "Alert dislike updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};



export const postCommentary = async (req, res) => {
    try {
        const { userId, commentId, comment, alertId, type } = req.body

        const alert = await Alert.findOne(alertId)

        if (type === 'User') {
            const user = await User.findOne({ userId })
            const name = user.name

            const commentary = {
                userId: userId,
                commentId: commentId,
                comment: comment,
                name: name,
                 type: 'Client'
            }

            alert.commentary.push(commentary)

            await alert.save()
        }

        if (type === 'Client') {
            const client = await Client.findOne({ clientId: userId })
            const name = client.name

            const commentary = {
                userId: userId,
                commentId: commentId,
                comment: comment,
                name: name,
                type: type
            }

            alert.commentary.push(commentary)

            await alert.save()

        };

        if (type === 'Driver') {
            const driver = await Driver.findOne({ driverId: userId })
            const name = driver.name

            const commentary = {
                userId: userId,
                commentId: commentId,
                comment: comment,
                name: name,
                 type: type
            }

            alert.commentary.push(commentary)

            await alert.save()
        };


        res.status(200).json({ message: "comment send" })

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "Alert not find" })
    }
}

export const deleteCommentary = async (req, res) => {
    try {
        const { alertId, commentId, userId } = req.body;

        const alert = await Alert.findOne({ alertId });

        const commentIndex = alert.commentary.findIndex(comment => comment.commentId === commentId);

        if (commentIndex !== -1) {
            alert.commentary.splice(commentIndex, 1);

            await alert.save();
            res.status(200).send({ Message: "Comment deleted successfully" });

        } else {
            res.status(404).send({ Message: "Comment not found" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({ Message: "Error deleting comment" });
    }
}

export const reportAlert = async (req, res) => {
    const { userId, alertId } = req.body;

    try {
        const alert = await Alert.findOne({ alertId });

        if (!alert) {
            return res.status(404).json({ message: 'Alerte non trouvée.' });
        }

        if (!alert.reportHistory.some(item => item.userId === userId)) {
            alert.reportCount += 1

            alert.reportHistory.push({
                userId: userId,
                count: 1
            })
        }


        await alert.save();

        res.json({ message: 'Alerte signalée avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur du serveur.' });
    }
};

export const reportCommentary = async (req, res) => {
    const { userId, alertId, commentId } = req.body;

    try {

        const alert = await Alert.findOne({ alertId });

        if (!alert) {
            return res.status(403).json({ message: 'Alerte non trouvée.' });
        }

        if (!alert.commentary) {
            return res.status(404).json({ message: 'Pas de commentaires pour cette alerte.' });
        }

        const comment = alert.commentary.find(item => item.commentId === commentId)



        if (!comment.reportHistory.some(item => item.userId === userId)) {
            comment.reportCount += 1

            comment.reportHistory.push({
                userId: userId,
                count: 1
            })
        }

        await alert.save();

        res.json({ message: 'Commentaire signalé avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur du serveur.' });
    }
};



