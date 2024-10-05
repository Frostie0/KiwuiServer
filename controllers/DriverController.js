import Driver from "../models/Driver.js"
import Mission from "../models/Mission.js";
import Order from "../models/Order.js";
import Seller from "../models/Sellers.js";
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadDriverImageController = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).send('No file uploaded.');
            return;
        }

        const file = req.file;
        cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
            if (error) {
                console.error('Upload to cloudinary failed:', error);
                res.sendStatus(500);
            } else {
                console.log('Upload to cloudinary successful');
                res.json({ imageUrl: result.url });
            }
        }).end(file.buffer);

        res.status(200).send('Image upload succesfully');

    } catch (error) {
        console.error('Error:', error);
        res.sendStatus(500);
    }
};

export const getProfileDriver = async (req, res) => {
    const { driverId } = req.params;
    try {
        const driver = await Driver.findOne({ driverId: driverId });

        if (!driver) {
            return res.status(404).send({ message: 'No driver found with this driverId.' });
        }

        res.status(200).send({ message: 'Driver tasks information retrieved successfully', driver });

    } catch (error) {

        console.log(error)
        res.status(500).send({ error: error.message });
    }
};

export const updateProfileController = async (req, res) => {

    const { driverId } = req.params;
    const { dataa, type } = req.body;

    try {

        const driver = await Driver.findOne({ driverId: driverId });

        if (!driver) {
            return res.status(404).send({ message: 'Compte non trouve.' });
        }

        if (type === 'Name') {
            driver.name = dataa;
        }
        if (type === 'Number') {
            driver.phone = dataa;
        }
        if (type === 'Password') {
            driver.password = dataa;
        }
        if (type === 'Notification') {
            driver.notificationStatut = dataa;
        }

        await driver.save();

        res.status(200).send({ message: 'Profile updated successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message });
    }
};



export const checkEmailDriverController = async (req, res) => {
    try {
        const { email } = req.body

        const driver = await Driver.findOne({ email: email });

        if (!driver) {
            return res.status(201).send({ message: 'No driver found with this email.' });
        }

        res.status(200).send({ message: 'client found.' })

    } catch (error) {

        console.log(error)
        res.status(500).send({ error: error.message });
    }
}

export const registerDriverController = async (req, res) => {
    try {
        const { driverId, email, password } = req.body

        const existingUser = await Driver.findOne({ email })

        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const driver = await Driver.create({ email, password, driverId });

        res.status(200).send({
            succes: true,
            message:
                "Registration successful.",
            driver,
        });

    } catch (error) {

        console.log(error)
        res.status(500).send({ error: error.message });
    }
}

export const loginDriverController = async (req, res) => {
    try {

        const MAX_ATTEMPTS = 3;
        const LOCK_TIME = 60 * 60 * 1000;

        const { email, password } = req.body;

        const driver = await Driver.findOne({ email });

        if (!driver) {
            return res.status(400).json({ message: "Email invalide" });
        }

        if (driver.lockUntil && driver.lockUntil > Date.now()) {
            const unlockTime = new Date(driver.lockUntil).toLocaleTimeString();
            return res.status(403).json({ message: `Compte verrouillé. Veuillez réessayer après 1 heure, vers ${unlockTime}.` });
        }

        if (driver.password !== password) {
            driver.loginAttempts += 1;
            if (driver.loginAttempts >= MAX_ATTEMPTS) {
                driver.lockUntil = Date.now() + LOCK_TIME;
                driver.loginAttempts = 0; // Réinitialiser les tentatives après verrouillage
            }
            await driver.save();
            return res.status(401).json({ message: `Mot de passe invalide, il vous reste ${MAX_ATTEMPTS - driver.loginAttempts} tentative(s)` });
        }

        driver.loginAttempts = 0; // Réinitialiser les tentatives après une connexion réussie
        driver.lockUntil = null;

        if (!driver.completedProfile) {
            return res.status(201).send({ driver, status: 201 })
        }

        if (!driver.completedDocument) {
            return res.status(201).send({ driver, status: 202 })
        }

        await driver.save();

        res.status(200).send({
            message: "Connexion réussie",
            driver
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message });
    }
};


export const completeProfileController = async (req, res) => {
    try {
        const { driverId } = req.params

        const { district, firstName, lastName, number, vehicule, type, type2 } = req.body

        const driver = await Driver.findOne({ driverId })

        if (!driver) {
            return res.status(400).send({ message: "Id don't existed" })
        }

        driver.shippingZone = district;
        driver.name = lastName + " " + firstName;
        driver.phone = number;
        driver.vehicule = vehicule;
        driver.type = type;
        driver.type2 = type2;
        driver.completedProfile = true

        await driver.save()

        res.status(200).send({ message: 'update make succesfully' })

    } catch (error) {
        console.log(error)
    }
}

export const completeTransportController = async (req, res) => {
    try {
        const { driverId } = req.params

        const { vehicule, type, type2 } = req.body

        const driver = await Driver.findOne({ driverId })

        if (!driver) {
            return res.status(400).send({ message: "Id don't existed" })
        }

        driver.vehicule = vehicule;
        driver.type = type;

        if (type2 !== "") {
            driver.type2 = type2;
        }

        driver.completedTransport = true

        await driver.save()

        res.status(200).send({ message: 'update make succesfully' })

    } catch (error) {
        console.log(error)
    }
}

export const updateDocumentController = async (req, res) => {

    const { driverId } = req.params;
    const { image, type } = req.body;
    try {
        const driver = await Driver.findOne({ driverId: driverId });

        if (!driver) {
            return res.status(404).send({ message: 'No driver found with this driverId.' });
        }

        if (type === 'Profile') {
            driver.profile = image;
        }
        if (type === 'Licence') {
            driver.licence = image;
        }
        if (type === 'Matricule') {
            driver.matricule = image;
        }
        if (type === 'CaseJustice') {
            driver.caseJustice = image;
        }

        await driver.save();

        res.status(200).send({ message: 'Profile image updated successfully', driver });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

export const getDriverTasksInfoController = async (req, res) => {
    const { driverId } = req.params;

    try {
        const driver = await Driver.findOne({ driverId: driverId });

        if (!driver) {
            return res.status(404).send({ message: 'No driver found with this driverId.' });
        }

        // Récupérer toutes les informations relatives à chaque orderId dans shippingOrderTask
        const tasks = await Promise.all(driver.shippingOrderTask.map(async ({ orderId }) => {
            const order = await Order.findOne({ orderId: orderId });
            return order;
        }));

        res.status(200).send({ message: 'Driver tasks information retrieved successfully', tasks });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

export const getDriverSellerBossInfoController = async (req, res) => {
    const { driverId } = req.params;

    try {
        const driver = await Driver.findOne({ driverId: driverId });

        if (!driver) {
            return res.status(404).send({ message: 'No driver found with this driverId.' });
        }

        // Récupérer toutes les informations relatives à chaque sellerId dans sellerBoss
        const sellerBoss = await Promise.all(driver.sellerBoss.map(async ({ sellerId }) => {
            const seller = await Seller.findOne({ sellerId: sellerId });
            return seller;
        }));

        res.status(200).send({ message: 'Driver sellerBoss information retrieved successfully', sellerBoss });
    } catch (error) {
        console.log(error)
        res.status(500).send({ error: error.message });
    }
};

export const getDriver = async (req, res) => {
    const { sellerId } = req.params;
    try {
        const driver = await Driver.find({})

        const driverList = driver.filter(item => !item.sellerBoss.includes(sellerId) && item.connected === true)
        const yourDriver = driver.filter(item => item.sellerBoss.includes(sellerId))

        res.status(200).send({ message: 'Driver', driverList, yourDriver });

    } catch (error) {
        console.log(error)
        res.status(500).send({ error: error.message });
    }
}

export const searchDriverController = async (req, res) => {
    try {
        const { text } = req.body;

        // Validation des données d'entrée
        if (!text || typeof text !== 'string') {
            return res.status(400).send({ message: "Veuillez fournir un texte de recherche valide." });
        }

        const driver = await Driver.find({})

        if (text) {
            const newData = driver.filter(item => {
                const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
                const textData = text.toUpperCase();
                return itemData.indexOf(textData) > -1
            })

            res.status(200).send({ driver: newData });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ erreur: "Erreur interne du serveur" });
    }
}

export const registerTokenController = async (req, res) => {
    try {
        const { driverId } = req.params
        const { token } = req.body

        const driver = await Driver.findOne({ driverId })

        if (!driver) {
            return res.status(404).send({ Message: "utilisateur non retrouve" })
        }

        driver.tokenDriver = token

        await driver.save()

        res.status(200).send({ token })

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "token don't save" })
    }
};

export const getActivityController = async (req, res) => {
    try {
        const { driverId } = req.params;

        const driver = await Driver.findOne({ driverId });

        if (!driver) {
            return res.status(404).send({ message: 'No driver found with this driverId.' });
        }

        const mission = await Mission.find({ driverId, payedDriverConfirmation: true });

        if (mission.length === 0) {
            return res.status(404).send({ message: 'No missions found for this driverId.' });
        }

        res.status(200).send({ activity: mission });

        console.log(mission);

    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message });
    }
};



