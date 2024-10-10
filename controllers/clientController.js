import Client from "../models/Client.js";
import Driver from "../models/Driver.js";
import Mission from "../models/Mission.js";
import Transaction from "../models/Transaction.js";
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadClientImageController = async (req, res) => {
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
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500);
  }
};

export const updateProfileController = async (req, res) => {

  const { clientId } = req.params;
  const { image, dataa, type } = req.body;
  try {
    const client = await Client.findOne({ clientId: clientId });

    if (!client) {
      return res.status(404).send({ message: 'Compte non trouve.' });
    }

    if (type === 'Profile') {

      if (client.profile === '') {

        client.profile = image;
      } else {

        const oldProfile = client.profile

        const urlParts = oldProfile.split('/');
        const id = urlParts[urlParts.length - 1].split('.')[0];

        cloudinary.uploader.destroy(id, function (error, result) {
          console.log(result, error);
        });

        client.profile = image
      }

    }

    if (type === 'Name') {
      client.name = dataa;
    }
    if (type === 'Number') {
      client.phone = dataa;
    }
    if (type === 'Password') {
      client.password = dataa;
    }
    if (type === 'Notification') {
      client.notificationStatut = dataa;
    }

    await client.save();

    res.status(200).send({ message: 'Profile updated successfully' });

  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
};

export const checkEmailController = async (req, res) => {
  try {
    const { email } = req.body

    const client = await Client.findOne({ email: email });

    if (!client) {
      return res.status(201).send({ message: 'No client found with this email.' });
    }

    res.status(200).send({ message: 'client found.' })

  } catch (error) {

    console.log(error)
    res.status(500).send({ error: error.message });
  }
}

export const registerClientController = async (req, res) => {
  try {
    const { email, password, phone, clientId } = req.body

    const existingUser = await Client.findOne({ email })

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const name = `User${Math.floor(1000000 + Math.random() * 9999999)}`

    const client = await Client.create({ email, password, clientId, phone, name });

    res.status(200).send({
      succes: true,
      message:
        "Registration successful.",
      client,
    });

  } catch (error) {

    console.log(error)
    res.status(500).send({ error: error.message });
  }
}

export const loginClientController = async (req, res) => {
  try {
    const MAX_ATTEMPTS = 3;
    const LOCK_TIME = 60 * 60 * 1000;
    const { email, password } = req.body;
    const client = await Client.findOne({ email });

    if (!client) {
      return res.status(400).json({ message: "Email invalide" });
    }

    if (client.lockUntil && client.lockUntil > Date.now()) {
      const unlockTime = new Date(client.lockUntil).toLocaleTimeString();
      return res.status(403).json({ message: `Compte verrouillé. Veuillez réessayer après 1 heure, vers ${unlockTime}.` });
    }

    if (client.password !== password) {
      client.loginAttempts += 1;
      if (client.loginAttempts >= MAX_ATTEMPTS) {
        client.lockUntil = Date.now() + LOCK_TIME;
        client.loginAttempts = 0; // Réinitialiser les tentatives après verrouillage
      }
      await client.save();
      return res.status(401).json({ message: `Mot de passe invalide, il vous reste ${MAX_ATTEMPTS - client.loginAttempts} tentative(s)` });
    }

    client.loginAttempts = 0; // Réinitialiser les tentatives après une connexion réussie
    client.lockUntil = null;
    await client.save();

    res.status(200).send({
      message: "Connexion réussie",
      client
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
};

export const registerTokenController = async (req, res) => {
  try {
    const { clientId } = req.params
    const { token } = req.body

    const client = await Client.findOne({ clientId })

    if (!client) {
      return res.status(404).send({ Message: "utilisateur non retrouve" })
    }

    client.tokenClient = token

    await client.save()

    res.status(200).send({ token })

  } catch (error) {
    console.log(error)
    res.status(500).send({ Message: "token don't save" })
  }
}

export const searchClientDriverTaxiController = async (req, res) => {
  const { clientId, orderId, paymentId, price, nbresPassager, pickup, delivered } = req.body;

  try {
    const client = await Client.findOne({ clientId: clientId });
    if (!client) {
      return res.status(404).send({ message: 'Aucun client trouvé avec cet identifiant client.' });
    }

    if (client.balance < 50) {
      return res.status(403).send({ message: "Votre solde doit être d/au moins 50 gourdes pour couvrir les frais de dédommagement en cas d/annulation d/une mission après plus de 2 minutes. Veuillez ajouter des fonds pour continuer à utiliser le service." });
    }

    const existingMission = await Mission.findOne({ clientId: clientId, payedDriverConfirmation: false });
    if (existingMission) {
      return res.status(403).send({ message: 'Une mission existe déjà pour ce client.' });
    }

    const missionByOrder = await Mission.findOne({ orderId: orderId });
    if (missionByOrder) {
      return res.status(403).send({ message: 'Une mission existe déjà avec cet identifiant de commande.' });
    }


    const addressDelivered = delivered.addressDelivered;
    const latitudeDelivered = delivered.latitude;
    const longitudeDelivered = delivered.longitude;

    const addressPickup = pickup.addressClient;
    const latitudePickup = pickup.latitude;
    const longitudePickup = pickup.longitude;

  const price = price;
  const nbresPassager = nbresPassager;

    const newMission = {
      type: 'Transport',
      orderId: orderId,
      paymentId: paymentId,
      phoneClient: client.phone,
      clientId: clientId,
      pickupLatitude: latitudePickup,
      pickupLongitude: longitudePickup,
      pickupAddress: addressPickup,
      deliveredLatitude: latitudeDelivered,
      deliveredLongitude: longitudeDelivered,
      deliveredAddress: addressDelivered,
      price: price,
      nbresPassager: nbresPassager
    };

    await Mission.create(newMission);

    res.status(200).send({ message: 'Order assigned successfully to the driver' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
};

export const getClientController = async (req, res) => {

  try {

    const { clientId } = req.params;

    const client = await Client.findOne({ clientId: clientId });

    if (!client) {
      console.log('client')
      return res.status(404).send({ message: 'No client found with this clientId.' });
    }

    const mission = await Mission.find({ clientId: clientId, payedDriverConfirmation: false });
    let activity = 0

    if (mission.length === 0) {
      activity = 0
    } else {
      activity = 1
    }


    res.status(200).send({ client: client, activity: activity });

  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
};

export const getActivityController = async (req, res) => {

  try {

    const { clientId } = req.params;

    const client = await Client.findOne({ clientId: clientId });

    if (!client) {
      console.log('client')
      return res.status(404).send({ message: 'No client found with this clientId.' });
    }

    const mission = await Mission.find({ clientId: clientId });

    if (mission.length === 0) {
      console.log('missions')
      return res.status(404).send({ message: 'No missions found for this clientId.' });
    }

    res.status(200).send({ activity: mission });

  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
};

export const cancelActivityController = async (req, res) => {
  try {

    const { clientId } = req.params;
    const { orderId } = req.body

    const client = await Client.findOne({ clientId: clientId });

    if (!client) {
      console.log('client')
      return res.status(404).send({ message: 'No client found with this clientId.' });
    }

    const mission = await Mission.findOne({ orderId: orderId });

    if (mission.length === 0) {
      console.log('missions')
      return res.status(404).send({ message: 'No missions found for this clientId.' });
    }

    if (mission.driverId !== "") {

      const driver = await Driver.findOne({ driverId: mission.driverId })

      driver.connected = false

      client.balance += parseInt(mission.price - (mission.price * 5 / 100))

      const transaction = await Transaction.create({
        id: clientId, orderId: Math.floor(0 + Math.random() * 100000000), amount: +parseInt(mission.price) - (mission.price * 5 / 100), statut: 'Successfully'
        , typePayment: 'Wallet', typeTransaction: 'Remboursement', transactionId: Math.floor(0 + Math.random() * 100000000),
      });

      await driver.save()
      await mission.deleteOne()
      await client.save()

      res.status(200).send({ message: 'activity delete succesfully', balance: client.balance })

    } else {

      if (mission.payed) {

        client.balance += parseInt(mission.price)

        const transaction = await Transaction.create({
          id: clientId, amount: +parseInt(mission.price), orderId: Math.floor(0 + Math.random() * 100000000), statut: 'Successfully'
          , typePayment: 'Wallet', typeTransaction: 'Remboursement', transactionId: Math.floor(0 + Math.random() * 100000000),
        });

      };


      await mission.deleteOne()
      await client.save()
      res.status(200).send({ message: 'activity delete succesfully', balance: client.balance })
    }


  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
};

export const ratingDriverController = async (req, res) => {
  try {

    const { clientId } = req.params;
    const { orderId, rating } = req.body

    const client = await Client.findOne({ clientId: clientId });

    if (!client) {
      console.log('client')
      return res.status(404).send({ message: 'No client found with this clientId.' });
    }

    const mission = await Mission.findOne({ orderId: orderId });

    if (mission.length === 0) {
      console.log('missions')
      return res.status(404).send({ message: 'No missions found for this clientId.' });
    }


    if (mission.driverId !== "") {

      const driver = await Driver.findOne({ driverId: mission.driverId });

      // Ajouter la nouvelle note à la somme des notes existantes
      const totalRating = (driver.rating * driver.ShippingCompleted) + rating;

      // Calculer la nouvelle note moyenne
      driver.rating = totalRating / driver.ShippingCompleted;

      mission.ratingBoolean = true;

      await driver.save();
      await client.save();
      await mission.save();

      res.status(200).send({ message: 'driver rate successfully' });
    }



  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
};
