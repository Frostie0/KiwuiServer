import Carou from "../models/Carou.js";
import Cart from "../models/Carts.js";
import Driver from "../models/Driver.js";
import Mission from "../models/Mission.js";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import Seller from "../models/Sellers.js";
import { v2 as cloudinary } from 'cloudinary';
import { Expo } from 'expo-server-sdk';


let expo = new Expo();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const registerSellerController = async (req, res) => {
  try {
    const { sellerId, name, phone, email, password } = req.body;

    const existingSeller = await Seller.findOne({ email });

    if (existingSeller) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingName = await Seller.findOne({ name });
    if (existingName) {
      return res.status(400).json({ message: "Name already exists" });
    }

    const newSeller = new Seller({ sellerId, name, phone, email, password });

    await newSeller.save();

    res.status(201).send({ message: 'Seller account created successfully', newSeller });
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message });
  }
};


export const loginSellerController = async (req, res) => {

  try {
    const { identifier, password } = req.body;

    const seller = await Seller.findOne({ $or: [{ email: identifier }, { phone: identifier }] });

    if (!seller) {
      return res.status(404).send({ message: 'No seller found with this email or phone number.' });
    }

    if (password !== seller.password) {
      return res.status(400).send({ message: 'Invalid password.' });
    }

    res.status(200).send({ message: 'Logged in successfully', sellerId: seller.sellerId });

  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export const updateSellerProfileController = async (req, res) => {
  const { sellerId, profileImageUrl } = req.body;
  try {
    const seller = await Seller.findOne({ sellerId: sellerId });

    if (!seller) {
      return res.status(404).send({ message: 'No seller found with this sellerId.' });
    }

    const oldProfile = seller.profile

    if (!oldProfile) {

      seller.profile = profileImageUrl;

    } else {

      const urlParts = oldProfile.split('/');
      const id = urlParts[urlParts.length - 1].split('.')[0];

      cloudinary.uploader.destroy(id, function (error, result) {
        console.log(result, error);
      });

      seller.profile = profileImageUrl

    }

    await seller.save();

    res.status(200).send({ message: 'Profile image updated successfully', seller });
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message });
  }
};


export const postSellerAddressController = async (req, res) => {
  const { sellerId, address, coordinate } = req.body;

  try {
    const seller = await Seller.findOne({ sellerId: sellerId });

    if (!seller) {
      return res.status(404).send({ message: 'No seller found with this sellerId.' });
    }

    seller.address = address;
    seller.coordinate = coordinate;
    seller.completedAddress = true;

    await seller.save();

    res.status(200).send({ message: 'Seller address created successfully', seller });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export const updateSellerAddressController = async (req, res) => {

  const { sellerId } = req.params;
  const { newAddress, coordinate, } = req.body;


  try {
    const seller = await Seller.findOne({ sellerId: sellerId });

    if (!seller) {
      return res.status(404).send({ message: 'No seller found with this sellerId.' });
    }

    const address = seller.address

    if (newAddress) address = newAddress;

    address.verified = false;

    if (coordinate) seller.coordinate = coordinate;

    await seller.save();

    res.status(200).send({ message: 'Seller address created successfully', seller });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export const confirmSellerAddressController = async (req, res) => {

  const { sellerId } = req.params;
  const { coordinate } = req.body;


  try {
    const seller = await Seller.findOne({ sellerId: sellerId });

    if (!seller) {
      return res.status(404).send({ message: 'No seller found with this sellerId.' });
    }

    const address = seller.address

    if (coordinate) seller.coordinate = coordinate;
    address.verified = true;

    await seller.save();

    res.status(200).send({ message: 'Seller address created successfully', seller });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export const completeShippingZoneController = async (req, res) => {
  try {
    const { sellerId } = req.params

    const { shippingZone } = req.body

    const seller = await Seller.findOne({ sellerId })

    if (!seller) {
      return res.status(400).send({ message: "Id don't existed" })
    }

    seller.shippingZone = shippingZone
    seller.completedFilter = true

    await seller.save()

    res.status(200).send({ message: 'update make succesfully' })

  } catch (error) {
    console.log(error)
  }
}



export const getDriverTaxi = async (req, res) => {
  try {
    const { sellerLatitude, sellerLongitude } = req.body;

    const drivers = await Driver.find({});

    const haversineDistance = (coords1, coords2) => {
      const R = 6371; // Rayon de la Terre en kilomètres
      const lat1 = coords1.latitude * Math.PI / 180;
      const lat2 = coords2.latitude * Math.PI / 180;
      const deltaLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
      const deltaLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const distance = (R * c) * 1000
      return distance
    };

    const sortedDrivers = [...drivers.sort((a, b) => {
      const distanceA = haversineDistance(
        { latitude: sellerLatitude, longitude: sellerLongitude },
        { latitude: a.latitude, longitude: a.longitude }
      );
      const distanceB = haversineDistance(
        { latitude: sellerLatitude, longitude: sellerLongitude },
        { latitude: b.latitude, longitude: b.longitude }
      );
      return distanceA - distanceB;
    })
    ]

    // Fonction pour envoyer une notification à un livreur
    const sendNotification = async (token) => {

      if (!Expo.isExpoPushToken(token)) {
        return false; // Si le token n'est pas valide, retourner false
      }

      if (token.length > 0) {

        let message = {
          to: token,
          sound: 'default',
          title: 'Order Notification',
          body: 'Felisitatsyon! , Ou resevwa yon nouveau komand',
          data: { withSome: 'data' },
        };

        let tickets = await expo.sendPushNotificationsAsync([message]);
        // Vous devez traiter les tickets ici pour vérifier les réponses des notifications

        // TODO: Implémentez la logique pour déterminer si le livreur a accepté la commande
        // Retournez true si le livreur accepte, sinon false
      }
    };

    // Boucle pour envoyer des notifications à chaque livreur
    for (const driver of sortedDrivers) {

      const token = driver.tokenDriver

      const accepted = await sendNotification(token);
      if (accepted) {
        // Le livreur a accepté la commande, arrêter la boucle
        break;
      }
      // Attendre 15 secondes avant d'envoyer la notification suivante
      await new Promise(resolve => setTimeout(resolve, 15000));
    }

    res.status(200).send({ message: "Recherche de livreur terminée" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erreur lors de la recherche de livreur" });
  }
};


export const addDriverSellerController = async (req, res) => {
  const { sellerId, driverId } = req.body;

  try {
    const seller = await Seller.findOne({ sellerId: sellerId });
    const driver = await Driver.findOne({ driverId: driverId });

    if (!seller) {
      return res.status(404).send({ message: 'No seller found with this sellerId.' });
    }

    if (!driver) {
      return res.status(404).send({ message: 'No driver found with this driverId.' });
    }

    // Vérifier si le driverId existe déjà dans le tableau driverEmployed
    const driverExists = seller.driverEmployed.includes(driverId);

    if (driverExists) {
      return res.status(400).send({ message: 'This driver is already employed by the seller.' });
    }

    // Ajouter le driverId au tableau driverEmployed
    seller.driverEmployed.push(driverId);

    // Ajouter le sellerId au tableau sellerBoss du conducteur
    driver.sellerBoss.push(sellerId);

    await seller.save();
    await driver.save();

    res.status(201).send({ message: 'Driver added successfully to the seller', seller });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export const removeDriverSellerController = async (req, res) => {
  const { sellerId, driverId } = req.body;

  try {
    const seller = await Seller.findOne({ sellerId: sellerId });
    const driver = await Driver.findOne({ driverId: driverId });

    if (!seller) {
      return res.status(404).send({ message: 'No seller found with this sellerId.' });
    }

    if (!driver) {
      return res.status(404).send({ message: 'No driver found with this driverId.' });
    }

    seller.driverEmployed = seller.driverEmployed.filter(driver => driver !== driverId);

    driver.sellerBoss = driver.sellerBoss.filter(seller => seller !== sellerId);

    await seller.save();
    await driver.save();

    res.status(200).send({ message: 'Driver removed successfully from the seller', seller });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export const assignOrderToDriverController = async (req, res) => {
  const { sellerId, driverId, orderId, latitude, longitude, addressSeller, price } = req.body;

  try {
    const seller = await Seller.findOne({ sellerId: sellerId });
    const driver = await Driver.findOne({ driverId: driverId });
    const order = await Order.findOne({ orderId: orderId });
    const mission = await Mission.findOne({ orderId: orderId })

    if (!seller) {
      return res.status(404).send({ message: 'No seller found with this sellerId.' });
    }

    if (!driver) {
      return res.status(404).send({ message: 'No driver found with this driverId.' });
    }

    if (!order) {
      return res.status(404).send({ message: 'No order found with this orderId.' });
    }

    if (mission) {
      return res.status(404).send({ message: 'Mission already existed .' });
    }

    // Vérifier si la commande appartient au vendeur
    if (order.sellerId !== sellerId) {
      return res.status(400).send({ message: 'This order does not belong to the seller.' });
    }

    const ShippingAddress = order.ShippingAddress[0]
    order.statut = 'Recherche'
    order.searchDriver = false
    order.driverId = driverId

    const deliveredAddress = `${ShippingAddress.street} ${ShippingAddress.streetNumber}, ${ShippingAddress.district}, ${ShippingAddress.postalCode}, ${ShippingAddress.city}, ${ShippingAddress.departement}, ${ShippingAddress.country}`
    const details = ShippingAddress.details

    const verified = order.feeVerified
    if (verified) {
      const latitudeDelivered = ShippingAddress.latitude
      const longitudeDelivered = ShippingAddress.longitude

      const newMission = {
        type :'Livraison',
        orderId: orderId,
        driverId: driverId,
        pickupLatitude: latitude,
        pickupLongitude: longitude,
        pickupAddress: addressSeller,
        deliveredLatitude: latitudeDelivered,
        deliveredLongitude: longitudeDelivered,
        deliveredAddress: deliveredAddress,
        price: price,
      }

      await Mission.create(newMission);

    } else {
      const newMission = {
        type :'Livraison',
        orderId: orderId,
        driverId: driverId,
        pickupLatitude: latitude,
        pickupLongitude: longitude,
        pickupAddress: addressSeller,
        deliveredAddress: deliveredAddress,
        details: details,
        price: price,
      }

      await Mission.create(newMission);

    }
    order.save()
    res.status(200).send({ message: 'Order assigned successfully to the driver' });

  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message });
  }
};

export const searchDriverTaxiController = async (req, res) => {
  const { sellerId, orderId, latitude, longitude, addressSeller, price } = req.body;

  try {
    const seller = await Seller.findOne({ sellerId: sellerId });
    const order = await Order.findOne({ orderId: orderId });
    const mission = await Mission.findOne({ orderId: orderId })

    if (!seller) {
      return res.status(404).send({ message: 'No seller found with this sellerId.' });
    }

    if (!order) {
      return res.status(404).send({ message: 'No order found with this orderId.' });
    }

    if (mission) {
      return res.status(404).send({ message: 'Mission already existed .' });
    }

    // Vérifier si la commande appartient au vendeur
    if (order.sellerId !== sellerId) {
      return res.status(400).send({ message: 'This order does not belong to the seller.' });
    }

    const ShippingAddress = order.ShippingAddress[0]
    order.statut = 'Recherche'

    const deliveredAddress = `${ShippingAddress.street} ${ShippingAddress.streetNumber}, ${ShippingAddress.district}, ${ShippingAddress.postalCode}, ${ShippingAddress.city}, ${ShippingAddress.departement}, ${ShippingAddress.country}`
    const details = ShippingAddress.details

    const verified = order.feeVerified
    if (verified) {
      const latitudeDelivered = ShippingAddress.latitude
      const longitudeDelivered = ShippingAddress.longitude

      const newMission = {
        type :'Livraison',
        orderId: orderId,
        pickupLatitude: latitude,
        pickupLongitude: longitude,
        pickupAddress: addressSeller,
        deliveredLatitude: latitudeDelivered,
        deliveredLongitude: longitudeDelivered,
        deliveredAddress: deliveredAddress,
        price: price,
      }

      await Mission.create(newMission);

    } else {
      const newMission = {
        type :'Livraison',
        orderId: orderId,
        pickupLatitude: latitude,
        pickupLongitude: longitude,
        pickupAddress: addressSeller,
        deliveredAddress: deliveredAddress,
        details: details,
        price: price,
      }

      await Mission.create(newMission);

    }
    order.save()
    res.status(200).send({ message: 'Order assigned successfully to the driver' });

  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message });
  }
};


export const removeOrderFromDriverController = async (req, res) => {
  const { driverId, orderId } = req.body;

  try {
    const driver = await Driver.findOne({ driverId: driverId });

    if (!driver) {
      return res.status(404).send({ message: 'No driver found with this driverId.' });
    }

    // Supprimer l'orderId du tableau shippingOrderTask
    driver.shippingOrderTask = driver.shippingOrderTask.filter(order => order.orderId !== orderId);

    await driver.save();

    res.status(200).send({ message: 'Order removed successfully from the driver', driver });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};



export const getSellerController = async (req, res) => {
  try {
    const sellerList = await Seller.find({})

    res.status(200).json({ sellerList })

  } catch (error) {
    res.status(500).json({ message: "Seller Not Find" })
  }
};

export const getSellerMarker = async (req, res) => {
  try {
    const sellerList = await Seller.find({})

    const sellerMarker = sellerList.filter(item => item.viewOnMap === true).map(item => item)

    res.status(200).json({ sellerMarker })

  } catch (error) {
    res.status(500).json({ message: "Seller Not Find" })
  }
};

export const searchSellerController = async (req, res) => {
  try {
    const { text } = req.body;

    // Validation des données d'entrée
    if (!text || typeof text !== 'string') {
      return res.status(400).send({ message: "Veuillez fournir un texte de recherche valide." });
    }

    const seller = await Seller.find({})

    if (text) {
      const newData = seller.filter(item => {
        const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1
      })
      res.status(200).send({ sellers: newData });
    }

  } catch (error) {
    console.error("Erreur lors de la recherche de produits :", error);
    res.status(500).send({ message: "Une erreur s'est produite lors de la recherche de produits." });
  }
};



export const getSellerId = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const { userId } = req.body;

    if (!sellerId) {
      return res.status(400).send({ message: "ID du vendeur non fourni dans la requête." });
    }

    const seller = await Seller.findOne({ sellerId });

    if (!seller) {
      return res.status(404).send({ message: "Vendeur non trouvé." });
    }

    const coordinate = seller.coordinate;
    const lat = coordinate.latitude;
    const lon = coordinate.longitude;

    if (userId) {
      seller.views += 1;
      seller.viewsHistory.push({ userId, date: Date.now() });
      await seller.save();
    }

    res.status(200).send({ seller: [seller], lat: lat, lon: lon });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Une erreur s'est produite lors de la recherche du vendeur." });
  }
};

export const upgradePlanController = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { niveau } = req.body;

    const seller = await Seller.findOne({ sellerId });

    if (niveau === 1 && niveau !== seller.niv) {
      if (seller.balance >= 129) {
        seller.balance -= 129;
        seller.niv = 1;
        seller.productMax = 250;
        seller.adsCarou = 0;
        seller.adsProduct = 5;
        seller.dashboard = true;

        seller.nivCreatedDate = Date.now();
        seller.nivExpiredDate = Date.now() + 29 * 24 * 60 * 60 * 1000;

        await seller.save();
        return res.status(200).send({ Message: "Amélioration effectuée avec succès !" });

      } else {
        return res.status(400).send({ Message: "Solde insuffisant" });
      }
    }

    if (niveau === 2 && niveau !== seller.niv) {
      if (seller.balance >= 269) {
        seller.balance -= 269;
        seller.niv = 2;
        seller.productMax = 2500;
        seller.adsProduct = 15;
        seller.adsCarou = 2;
        seller.dashboard = true;

        seller.nivCreatedDate = Date.now();
        seller.nivExpiredDate = Date.now() + 29 * 24 * 60 * 60 * 1000;

        await seller.save();
        return res.status(200).send({ Message: "Amélioration effectuée avec succès !" });

      } else {
        return res.status(400).send({ Message: "Solde insuffisant" });
      }
    }

    await seller.save();

    res.status(201).send({ Message: "Amélioration impossible" });

  } catch (error) {
    console.log(error);
    res.status(500).send({ Message: "Amélioration echouer" });
  }
};

export const buyAdsProductController = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findOne({ sellerId });

    if (seller.balance >= 10) {
      seller.balance -= 10;
      seller.adsProduct += 1;
      await seller.save();
      res.status(200).send({ Message: "Achat d'AdsProduct réussi !" });
    } else {
      res.status(400).send({ Message: "Solde insuffisant" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ Message: "Erreur lors de l'achat d'AdsProduct" });
  }
};

export const buyAdsCarouController = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findOne({ sellerId });

    if (seller.balance >= 100) {
      seller.balance -= 100;
      seller.adsCarou += 1;
      await seller.save();
      res.status(200).send({ Message: "Achat d'AdsCarou réussi !" });
    } else {
      res.status(400).send({ Message: "Solde insuffisant" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ Message: "Erreur lors de l'achat d'AdsCarou" });
  }
};

export const sellAdsProductController = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findOne({ sellerId });

    if (seller.adsProduct > 0) {
      seller.balance += 10;
      seller.adsProduct -= 1;
      await seller.save();
      res.status(200).send({ Message: "Vente d'AdsProduct réussie !" });
    } else {
      res.status(400).send({ Message: "Aucun AdsProduct à vendre" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ Message: "Erreur lors de la vente d'AdsProduct" });
  }
};

export const sellAdsCarouController = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findOne({ sellerId });

    if (seller.adsCarou > 0) {
      seller.balance += 100;
      seller.adsCarou -= 1;
      await seller.save();
      res.status(200).send({ Message: "Vente d'AdsCarou réussie !" });
    } else {
      res.status(400).send({ Message: "Aucun AdsCarou à vendre" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ Message: "Erreur lors de la vente d'AdsCarou" });
  }
};

export const sendRequestCarouController = async (req, res) => {
  const { imageId, imageUrl, productId, carouId, adsCarou, sellerId } = req.body;

  const now = new Date();

  const newImage = {
    sellerId: sellerId,
    adsCarou: adsCarou,
    imageId: imageId,
    url: imageUrl,
    productId: productId,
    created: now,
    status: "Waiting for approval"
  };

  try {
    const carou = await Carou.findById(carouId);
    if (!carou) {
      return res.status(404).send({ message: 'Carrousel non trouvé' });
    }

    carou.pending.push(newImage);
    await carou.save();

    res.status(200).send({ message: 'Demande de postage de carrousel créée avec succès', carouId: carou._id });
  } catch (error) {
    console.error('Erreur lors de la création de la demande de postage de carrousel :', error);
    res.status(500).send({ message: 'Erreur lors de la création de la demande de postage de carrousel' });
  }
};

export const getDashboardController = async (req, res) => {
  try {
    const { sellerId } = req.params
    const { startDate, endDate, period } = req.body

    const order = await Order.find({ sellerId })
    const cartDocuments = await Cart.find({ sellerId: sellerId })
    const product = await Product.find()
    const seller = await Seller.findOne({ sellerId })

    function getDateKey(date, period) {
      switch (period) {
        case '7days':
          // Retourne la date au format 'AAAA-MM-JJ'
          return date.toISOString().split('T')[0]
        case '1month':
          // Retourne l'année et le mois au format 'AAAA-MM'
          return date.toISOString().split('T')[0].slice(0, 7)
        case '3months':
        case '6months':
        case '1year':
        case 'alltime':
          // Retourne l'année au format 'AAAA'
          return date.toISOString().split('T')[0].slice(0, 4)
        default:
          throw new Error(`Période non reconnue : ${period}`)
      }
    }

    function getLabels(period) {
      switch (period) {
        case '7days':
          return ['Day1', 'Day2', 'Day3', 'Day4', 'Day5', 'Day6', 'Day7']
        case '1month':
          return Array.from({ length: 15 }, (_, i) => `${i + 1}`)
        case '3months':
          return ['Month1', 'Month2', 'Month3']
        case '6months':
          return ['Month1', 'Month2', 'Month3', 'Month4', 'Month5', 'Month6']
        case '1year':
          return Array.from({ length: 12 }, (_, i) => `${i + 1}`)
        case 'alltime':
          return ['Year1', 'Year2', 'Year3', 'Year4', 'Year5']
        default:
          throw new Error(`Période non reconnue : ${period}`)
      }
    }

    const productFiltered = product.filter(item => {
      const productDate = Date.parse(item.createdAt);
      return productDate >= startDate && productDate <= endDate;
    });

    const orderFiltered = order.filter(item => {
      const orderDate = Date.parse(item.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });


    // const orderFiltered = order.filter(item => Date.parse(item.createdAt) >= time)
    // const productFiltered = product.filter(item => Date.parse(item.createdAt) >= time)

    let allCarts = []
    for (const doc of cartDocuments) {
      allCarts = [...allCarts, ...doc.carts]
    }

    // const cartFiltered = allCarts.filter(item => Date.parse(item.createdAt) >= time)

    const cartFiltered = allCarts.filter(item => {
      const cartDate = Date.parse(item.createdAt);
      return cartDate >= startDate && cartDate <= endDate;
    });

    let data1 = []
    let data2 = []
    let totalsByDay = {}
    let totalsByDay1 = {}

    for (const item of orderFiltered) {
      const dateKey = getDateKey(item.createdAt, period)
      if (item.freeShipping === true) {
        totalsByDay[dateKey] = (totalsByDay[dateKey] || 0) + (item.totalPrice - item.feeShipping)
      } else {
        totalsByDay[dateKey] = (totalsByDay[dateKey] || 0) + item.totalPrice
      }
    }

    for (let day in totalsByDay) {
      data1.push(totalsByDay[day])
    }

    let totalGain = 0;

    for (const item of orderFiltered) {
      if (item.freeShipping === true) {
        totalGain += (item.totalPrice - item.feeShipping)
      } else {
        totalGain += item.totalPrice
      }
    }


    for (const item1 of cartFiltered) {
      const dateKey1 = getDateKey(item1.createdAt, period)
      totalsByDay1[dateKey1] = (totalsByDay1[dateKey1] || 0) + (item1.price * item1.quantity)
    }

    for (let day1 in totalsByDay1) {
      data2.push(totalsByDay1[day1])
    }

    let totalEstimatedGain = 0;

    for (const item of cartFiltered) {
      totalEstimatedGain += (item.price * item.quantity)
    }


    const labels = getLabels(period)

    const lineData = {
      labels: labels,
      datasets: [
        {
          data: data1,
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 1
        },
        // {
        //   data: data2,
        //   color: (opacity = 1) => `rgba(0, 255, 255, ${opacity})`,
        //   strokeWidth: 1
        // }
      ],
      legend: ['Gain']
    };
    // 'Estimated Cart Gain'
    let colors = ['#7E909A', '#AC3E31', '#DBAE58', '#1C4E80', '#202020', '#A5D8DD', '#EA6A47', '#0091D5', '#DADADA', '#6AB187', '#B3C100', '#1F3F49', '#D32D41', '#CED2CC', '#00000']

    let productCountsByCategory = {}

    for (const item of productFiltered) {
      const category = item.category

      // Si cette catégorie existe déjà dans productCountsByCategory, ajoutez 1 au compte, sinon définissez-le sur 1
      productCountsByCategory[category] = (productCountsByCategory[category] || 0) + 1
    }

    let pieData = []
    let colorIndex = 0

    for (let category in productCountsByCategory) {
      pieData.push({
        name: category,
        products: productCountsByCategory[category],
        color: colors[colorIndex % colors.length], // Utilisez une couleur unique pour chaque catégorie
        legendFontColor: '#7F7F7F',
        legendFontSize: 13
      })

      colorIndex++
    }

    const progressData1 = seller.product.length
    const progressData2 = seller.productMax


    let salesCountsByCategory = {}
    let earningsByCategory = {}

    for (const item of orderFiltered) {
      const products = item.products

      for (const product of products) {
        const category = product.category
        const earnings = product.price * product.quantity  // Modifié ici

        // Si cette catégorie existe déjà dans salesCountsByCategory, ajoutez 1 au compte, sinon définissez-le sur 1
        salesCountsByCategory[category] = (salesCountsByCategory[category] || 0) + 1

        // Si cette catégorie existe déjà dans earningsByCategory, ajoutez les gains, sinon définissez-le sur les gains de la commande actuelle
        earningsByCategory[category] = (earningsByCategory[category] || 0) + earnings
      }
    }

    let salesBarData = {
      labels: [],
      datasets: [
        {
          data: [],
          color: "rgba(255, 255, 255, 1)"
        }
      ]
    }

    let earningsBarData = {
      labels: [],
      datasets: [
        {
          data: [],
          color: "rgba(255, 255, 255, 1)"
        }
      ]
    }

    for (let category in salesCountsByCategory) {
      salesBarData.labels.push(category)
      salesBarData.datasets[0].data.push(salesCountsByCategory[category])
    }

    for (let category in earningsByCategory) {
      earningsBarData.labels.push(category)
      earningsBarData.datasets[0].data.push(earningsByCategory[category])
    }

    const totalOrder = orderFiltered.length

    const visitor = seller.viewsHistory.filter(item => {
      const visitorDate = Date.parse(item.date);
      return visitorDate >= startDate && visitorDate <= endDate;
    });

    const totalVisitor = visitor.length


    let productCountsBySubCategory = {}

    for (const item of productFiltered) {
      const subCategory = item.subCategory

      // Si cette sous-catégorie existe déjà dans productCountsBySubCategory, ajoutez 1 au compte, sinon définissez-le sur 1
      productCountsBySubCategory[subCategory] = (productCountsBySubCategory[subCategory] || 0) + 1
    }

    // Convertir l'objet en un tableau de paires clé-valeur
    let entries = Object.entries(productCountsBySubCategory)
    // Trier le tableau par le nombre de produits (qui est la deuxième valeur de chaque paire)
    entries.sort((a, b) => b[1] - a[1])
    // Maintenant, 'entries' est un tableau de paires clé-valeur triées par le nombre de produits
    let rankSubCategory = entries  // Si vous voulez juste les sous-catégories triées


    let productCountsBySubSubCategory = {}

    for (const item of productFiltered) {
      const subSubCategory = item.subSubCategory

      // Si cette sous-catégorie existe déjà dans productCountsBySubCategory, ajoutez 1 au compte, sinon définissez-le sur 1
      productCountsBySubSubCategory[subSubCategory] = (productCountsBySubSubCategory[subSubCategory] || 0) + 1
    }

    // Convertir l'objet en un tableau de paires clé-valeur
    let entries1 = Object.entries(productCountsBySubSubCategory)
    // Trier le tableau par le nombre de produits (qui est la deuxième valeur de chaque paire)
    entries1.sort((a, b) => b[1] - a[1])
    // Maintenant, 'entries' est un tableau de paires clé-valeur triées par le nombre de produits
    let rankSubSubCategory = entries1  // Si vous voulez juste les sous-catégories triées


    let mostSoldProductByCategory = {}

    for (const item of orderFiltered) {
      const products = item.products

      for (const product of products) {
        const category = product.category
        const title = product.title
        const image = product.image
        const price = product.price

        // Si cette catégorie n'existe pas encore dans mostSoldProductByCategory, ajoutez ce produit
        if (!mostSoldProductByCategory[category]) {
          mostSoldProductByCategory[category] = { title: title, count: product.quantity, image: image, price: price }
        } else {
          // Si ce produit est le même que le produit le plus vendu actuel, ajoutez la quantité à la quantité actuelle
          if (mostSoldProductByCategory[category].title === title) {
            mostSoldProductByCategory[category].count += product.quantity
          } else if (product.quantity > mostSoldProductByCategory[category].count) {
            // Si ce produit a une quantité plus grande que le produit le plus vendu actuel, remplacez le produit le plus vendu
            mostSoldProductByCategory[category] = { title: title, count: product.quantity, image: image, price: price }
          }
        }
      }
    }

    // Maintenant, 'mostSoldProductByCategory' est un objet où chaque clé est une catégorie et chaque valeur est un objet avec le titre du produit le plus vendu et le nombre de fois où il a été acheté

    let mostSoldProductBySubCategory = {}
    let mostSoldProductBySubSubCategory = {}

    for (const item of orderFiltered) {
      const products = item.products

      for (const product of products) {
        const subCategory = product.subCategory
        const subSubCategory = product.subSubCategory // Assurez-vous que vos produits ont une propriété 'subSubCategory'
        const title = product.title
        const quantity = product.quantity
        const price = product.price
        const image = product.image


        if (!mostSoldProductBySubCategory[subCategory]) {
          mostSoldProductBySubCategory[subCategory] = { title: title, count: quantity, image: image, price: price }
        } else {
          // Si ce produit est le même que le produit le plus vendu actuel, ajoutez la quantité à la quantité actuelle
          if (mostSoldProductBySubCategory[subCategory].title === title) {
            mostSoldProductBySubCategory[subCategory].count += product.quantity
          } else if (product.quantity > mostSoldProductBySubCategory[subCategory].count) {
            // Si ce produit a une quantité plus grande que le produit le plus vendu actuel, remplacez le produit le plus vendu
            mostSoldProductBySubCategory[subCategory] = { title: title, count: product.quantity, image: image, price: price }
          }
        }

        // // Pour les sous-catégories
        // if (!mostSoldProductBySubCategory[subCategory] || quantity > mostSoldProductBySubCategory[subCategory].count) {
        //   mostSoldProductBySubCategory[subCategory] = { title: title, count: quantity, image: image, price: price }
        // }

        if (!mostSoldProductBySubSubCategory[subSubCategory]) {
          mostSoldProductBySubSubCategory[subSubCategory] = { title: title, count: quantity, image: image, price: price }
        } else {
          // Si ce produit est le même que le produit le plus vendu actuel, ajoutez la quantité à la quantité actuelle
          if (mostSoldProductBySubSubCategory[subSubCategory].title === title) {
            mostSoldProductBySubSubCategory[subSubCategory].count += product.quantity
          } else if (product.quantity > mostSoldProductBySubSubCategory[subSubCategory].count) {
            // Si ce produit a une quantité plus grande que le produit le plus vendu actuel, remplacez le produit le plus vendu
            mostSoldProductBySubSubCategory[subSubCategory] = { title: title, count: product.quantity, image: image, price: price }
          }
        }

        // Pour les sous-sous-catégories
        // if (!mostSoldProductBySubSubCategory[subSubCategory] || quantity > mostSoldProductBySubSubCategory[subSubCategory].count) {
        //   mostSoldProductBySubSubCategory[subSubCategory] = { title: title, count: quantity, image: image , price:price}
        // }
      }
    }

    // Maintenant, 'mostSoldProductBySubCategory' et 'mostSoldProductBySubSubCategory' sont des objets où chaque clé est une sous-catégorie ou une sous-sous-catégorie et chaque valeur est un objet avec le titre du produit le plus vendu et le nombre de fois où il a été acheté


    res.status(200).send({
      lineData: lineData, pieData: pieData, progressData1: progressData1, progressData2: progressData2,
      salesBarData: salesBarData, earningsBarData: earningsBarData, rankSubCategory: rankSubCategory, rankSubSubCategory: rankSubSubCategory,
      totalOrder: totalOrder, totalVisitor: totalVisitor, gain: totalGain, estimatedGain: totalEstimatedGain,
      mostSoldProductByCategory: mostSoldProductByCategory, mostSoldProductBySubCategory: mostSoldProductBySubCategory, mostSoldProductBySubSubCategory: mostSoldProductBySubSubCategory
    })

  } catch (error) {
    console.log(error),
      res.status(500).send({ Message: "data dont find" })
  }
};













