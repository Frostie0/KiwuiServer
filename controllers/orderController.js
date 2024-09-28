import moncash from 'nodejs-moncash-sdk';
import dotenv from 'dotenv';
import User from '../models/user.js';
import Order from '../models/Order.js';
import Cart from '../models/Carts.js';
import Transaction from '../models/Transaction.js';
import Product from '../models/Products.js';
import Seller from '../models/Sellers.js';
import Driver from '../models/Driver.js';
import { Expo } from 'expo-server-sdk';
import Promo from '../models/Promo.js';
import Client from '../models/Client.js';


let expo = new Expo();


dotenv.config();

//Moncash
moncash.configure({
  mode: process.env.MONCASH_MODE,
  client_id: process.env.MONCASH_CLIENT_ID,
  client_secret: process.env.MONCASH_CLIENT_SECRET,
});


export const moncashPaymentController = async (req, res) => {
  try {

    const id = req.body.userId;
    const number = req.body.number;
    const typePayment = req.body.typePayment;
    const typeTransaction = req.body.typeTransaction;
    const statut = req.body.statut;
    const amount = req.body.amount;
    const orderId = req.body.orderId;
    const transactionId = req.body.transactionId;


    const create_payment_json = {
      amount: req.body.amount,
      orderId: req.body.orderId,
    };

    const payment_creator = moncash.payment;
    payment_creator.create(create_payment_json, async function (err, payment) {
      if (err) {
        console.log(err);
        return res.status(500).json({
          error: err,
        });
      } else {

        res.status(200).json(payment_creator.redirect_uri(payment));
      }
    });

    const existingTransaction = await Transaction.findOne({ orderId })

    if (existingTransaction) {
      return res.status(400).json({ message: "Transaction already registered" });
    }

    const transaction = await Transaction.create({
      id, number, orderId, amount, statut
      , typePayment, typeTransaction, transactionId,
    });


  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "payment not send" })
  }
}

export const moncashRetreatController = async (req, res) => {
  try {
    const { id, user, number, typePayment, typeTransaction, statut, amount, orderId, transactionId } = req.body;

    const existingTransaction = await Transaction.findOne({ orderId })

    if (existingTransaction) {
      return res.status(400).json({ message: "Transaction already registered" });
    }

    if (user === 'client') {

      const client = await Client.findOne({ clientId: id })

      if (!client) {
        return res.status(404).json({ message: "Client not find" });
      }

      if (client.balance < amount) {
        return res.status(400).json({ message: "Balance insuffisant" });
      }

      const transaction = await Transaction.create({
        id, number, orderId, amount: -amount, statut,
        typePayment, typeTransaction, transactionId
      });

      client.balance -= amount

      await client.save()

      res.status(200).json({ message: "Retrait effectuez" });

    }

    if (user === 'driver') {

      const driver = await Driver.findOne({ driverId: id })

      if (!driver) {
        return res.status(404).json({ message: "Driver not find" });
      }

      if (driver.balance < amount) {
        return res.status(400).json({ message: "Balance insuffisant" });
      }

      const transaction = await Transaction.create({
        id, number, orderId, amount: -amount, statut,
        typePayment, typeTransaction, transactionId
      });

      driver.balance -= amount

      await driver.save();

      res.status(200).json({ message: "Retrait effectuez" });

    }


  } catch (error) {

    console.log(error);
    res.status(500).send({ error });

  }
}

export const moncashTransferController = async (req, res) => {
  try {
    const { amount, receiver, desc } = req.body;

    // Crée l'objet de transfert
    const create_transfer_json = {
      "amount": amount,
      "receiver": receiver,
      "desc": desc
    };

    // Initialise le créateur de transfert
    var transfer_creator = moncash.capture;

    // Crée le transfert
    transfer_creator.create(create_transfer_json, function (error, transfer) {
      if (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création du transfert" });
      } else {
        console.log("Create Transfer Response");
        // Réponse de succès avec les détails du transfert
        res.status(200).json({
          path: "/Api/v1/Transfert",
          transfer: {
            transaction_id: transfer.transaction_id, // ID de transaction fourni par MonCash
            amount: transfer.amount,
            receiver: transfer.receiver,
            message: "successful",
            desc: transfer.desc
          },
          timestamp: Date.now(),
          status: 200
        });
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).send({ Message: "trasnfert dont send" })
  }
}


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

export const getTransaction = async (req, res) => {
  try {
    const { id } = req.params

    const transaction = await Transaction.find({ id })

    res.status(200).json({ transaction })

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "history not send" })
  }
}

export const sendOrder = async (req, res) => {
  try {
    const { userId, cartItems, totalPrice, discount, codePromo, address, paymentMethod, name } =
      req.body;

    const user = await User.findOne({ userId });

    if (codePromo.length !== 0) {
      const promo = await Promo.findOne({ codePromo });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!promo) {
        return res.status(403).send({ message: "Kòd pwomo sa pa ekziste" })
      }

      const { use, maxUse, userCodeUse } = promo

      if (userCodeUse.includes(userId)) {
        return res.status(400).send({ Message: "Kòd pwomo deja itilize" })
      }

      if (use >= maxUse) {
        return res.status(401).send({ Message: "Dezole, kòd pwomo sa pa disponib ankò" })
      }

      promo.use += 1
      promo.userCodeUse.push(userId)

      await promo.save()
    }


    if (user.balance < totalPrice) {

      const needBalance = totalPrice - user.balance
      const statut = 200

      return res.status(200).send({ message: 'balance is not enought', needBalance, statut })
    }

    const unavailableItems = [];
    let allItemsAvailable = true;

    for (const item of cartItems) {

      const sellerId = item.sellerId
      const cartFind = await Cart.findOne({ sellerId, userId })
      const carts = cartFind.carts

      for (const item1 of carts) {
        const cartId = item1.cartId
        const cart = carts.find(item => item.cartId === cartId)

        if (!cart) {
          unavailableItems.push({ cartId, title: item.title });
          allItemsAvailable = false;
          continue;
        }
        if (item.quantity > cart.dispoQuantity) {
          const quantity = cart.dispoQuantity
          const title = item.title
          unavailableItems.push({ cartId, quantity, title });
          allItemsAvailable = false;
        }
        if (!allItemsAvailable) {
          return res.status(201).send({ unavailableItems, message: 'Quantities not available', status: 201 });
        }
      }

    }

    for (const item2 of cartItems) {

      const carts = item2.carts;

      for (const item3 of carts) {
        const productId = item3.productId;
        const product = await Product.findOne({ productId });
        const products = product.products.find(item => item.productsId === item3.productsId);
        const sizeInfo = products.sizes.find(item => item.size === item3.selectedSize);

        if (sizeInfo) {
          if (sizeInfo.dispo > 0) {
            sizeInfo.dispo -= item3.quantity;
          }
        }

        await product.save();
      }
    }


    // for (const item of cartItems) {
    //   const sellerId = item.sellerId;
    //   const carts = item.carts;

    //   const cartSeller = await Cart.find({ sellerId });

    //   for (const item2 of carts) {
    //     const selectedColor = item2.selectedColor;
    //     const selectedSize = item2.selectedSize;
    //     const productsId = item2.productsId;
    //     const quantity = item2.quantity;

    //     for (const item3 of cartSeller) {
    //       const cartsSeller = item3.carts;

    //       for (const cartProduct of cartsSeller) {
    //         if (cartProduct.productsId === productsId &&
    //           cartProduct.selectedColor === selectedColor &&
    //           cartProduct.selectedSize === selectedSize) {

    //           cartProduct.dispoQuantity -= quantity;

    //           if (cartProduct.quantity > cartProduct.dispoQuantity) {
    //             cartProduct.quantity = cartProduct.dispoQuantity;
    //           }

    //           await item3.save();
    //         }
    //       }
    //     }
    //   }
    // }


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

    for (const cart of cartItems) {

      let freeShipping = true
      let feeVerified = false
      const details = cart.details
      const sellerId = cart.sellerId
      const verifiedAddress = cart.verifiedAddress
      let feeShipping = 0

      const carts = cartItems
        .filter(item => item.sellerId === sellerId)
        .map(item => item.carts).flat()

      if (cart.carts.some(item => item.freeShipping === false)) {
        freeShipping = false
      }

      if (verifiedAddress === true && address.some(item => item.verified === true)) {

        const originalsCarts = [...carts]
        const fee = originalsCarts.sort((a, b) => b.feeShipping - a.feeShipping)
        const fee1 = fee.map(item => item.feeShipping)

        const lat1 = address.map(item => item.latitude)[0];
        const lon1 = address.map(item => item.longitude)[0];
        const lat2 = cart.latitude;
        const lon2 = cart.longitude;

        const distance = haversine(lat1, lon1, lat2, lon2);

        feeShipping = parseInt((distance * 1000) * (fee1[0] / 1000) / 1)
        feeVerified = true
      }


      const products = carts.map((item) => ({
        title: item?.title,
        quantity: item.quantity,
        price: item?.price,
        image: item?.image,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        category: item.category,
        subCategory: item.subCategory,
        subSubCategory: item.subSubCategory,
        cartId: item.cartId,
        productsId: item.productsId,
        productId: item.productId,
        sellerId: sellerId,
        dateShipping: item.dateShipping,
      }));

      const ShippingAddress = address.map((item) => ({
        name: item.name,
        mobileNo: item.mobileNo,
        city: item.city,
        district: item.district,
        departement: item.departement,
        country: item.country,
        street: item.street,
        streetNumber: item.streetNumber,
        type: item?.type,
        postalCode: item?.postalCode,
        details: item?.details,
        longitude: item?.longitude,
        latitude: item?.latitude,
      }))

      const total = carts
        .map(item => item.quantity * item.price)
        .reduce((curr, prev) => curr + prev, 0)

      const totals = total + feeShipping

      const promoDiscount = discount

      let codePromo = false
      if (discount !== 0) {
        codePromo = true
      }

      const orderId = Math.floor(10000000 + Math.random() * 90000000);
      const paymentId = Math.floor(10000000 + Math.random() * 90000000);


      const order = new Order({
        userId: userId,
        name: name,
        sellerId: sellerId,
        products: products,
        totalPrice: totals,
        promoDiscount: promoDiscount,
        codePromo: codePromo,
        feeShipping: feeShipping,
        ShippingAddress,
        paymentMethod: paymentMethod,
        details: details,
        orderId: orderId,
        paymentId: paymentId,
        freeShipping: freeShipping,
        feeVerified: feeVerified
      });

      await order.save();
    };



    user.balance -= totalPrice

    await user.save();

    for (const cart of cartItems) {
      const carts = cart.carts;

      for (const item of carts) {
        const { productId, quantity, price: salePrice } = item;

        const product = await Product.findOne({ productId })

        if (!product) {
          console.log(`Product not found: ${productId}`);
          continue;
        }

        product.sales += quantity;
        product.salesHistory.push({ date: Date.now(), quantity, salePrice });
        await product.save()
      }
    }

    // for (const item of cartItems) {
    //   const carts = item.carts;
    //   const sellerId = item.sellerId;

    //   for (const item1 of carts) {
    //     const cartId = item1.cartId;

    //     let cartFind = await Cart.findOne({ sellerId, userId });

    //     if (cartFind) {
    //       const existingCart = cartFind.carts.find(cart => cart.cartId === cartId);

    //       if (existingCart) {
    //         await Cart.findOneAndUpdate(
    //           { sellerId, userId },
    //           { $pull: { carts: { cartId: existingCart.cartId } } }
    //         );

    //         cartFind = await Cart.findOne({ sellerId, userId });
    //       }

    //       if (cartFind && cartFind.carts.length === 0) {
    //         await cartFind.deleteOne();
    //       }

    //     } else {
    //       return res.status(404).send({
    //         message: "Panier non trouvé",
    //         success: false
    //       });
    //     }
    //   }
    // }


    for (const item of cartItems) {
      const { sellerId } = item

      const seller = await Seller.findOne({ sellerId })

      if (!Expo.isExpoPushToken(seller.tokenSeller)) {
        continue;
      }

      if (seller.tokenSeller.length > 0) {

        let message = {
          to: seller.tokenSeller,
          sound: 'default',
          title: 'Order Notification',
          body: 'Felisitatsyon! , Ou resevwa yon nouveau komand',
          data: { withSome: 'data' },
        };

        await expo.sendPushNotificationsAsync([message]);
      }


    }


    res.status(204).send({ message: "Order created successfully!", status: 204 });

  } catch (error) {
    console.log("error creating orders", error);
    res.status(500).json({ message: "Error creating orders" });
  }
};



export const getOrder = async (req, res) => {
  try {
    const userId = req.params.userId;

    const orders = await Order.find({ userId }).populate("userId");

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" })
    }

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

export const getOrderSeller = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    const orders = await Order.find({ sellerId }).populate("sellerId");

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" })
    }

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};


export const confirmShippingController = async (req, res) => {
  try {
    const { sellerId, paymentId } = req.body

    const order = await Order.findOne({ sellerId, paymentId })
    const seller = await Seller.findOne({ sellerId })

    if (!order) {
      return res.status(400).send({ Message: "order don't find" })
    }

    if (sellerId !== order.sellerId) {
      return res.status(403).send({ Message: "Vous n'êtes pas autorisé à confirmer cette livraison" })
    }

    if (order.freeShipping === true && order.statut !== "Livre" && order.statut !== "Ranbouse") {
      seller.balance += (order.totalPrice - order.feeShipping)
      return res.status(200).send({ sellerBalance, orderStatut })
    }

    if (order.freeShipping === false && order.statut !== "Livre" && order.statut !== "Ranbouse") {
      seller.balance += order.totalPrice
      return res.status(200).send({ sellerBalance, orderStatut })
    }


    order.statut = "Livre"

    const sellerBalance = seller.balance
    const orderStatut = order.statut

    await seller.save()
    await order.save()

    res.status(201).send({ sellerBalance, orderStatut, Message: "Transaction deja excute" })

  } catch (error) {
    console.log(error)
    res.status(500).send({ Message: "Payment not confirmed" })
  }
}

export const confirmShippingByDriverController = async (req, res) => {
  try {
    const { sellerId, orderId, driverId, paymentId } = req.body

    const order = await Order.findOne({ sellerId, paymentId })
    const seller = await Seller.findOne({ sellerId })
    const driver = await Driver.findOne({ driverId })

    if (!order) {
      return res.status(400).send({ Message: "order don't find" })
    }

    if (sellerId !== order.sellerId) {
      return res.status(402).send({ Message: "Vous n'êtes pas autorisé à confirmer cette livraison" })
    }

    if (driver.shippingOrderTask.some(item => item.orderId !== orderId)) {
      return res.status(403).send({ Message: "Vous n'êtes pas autorisé à confirmer cette livraison driver" })
    }

    if (order.freeShipping === true && order.statut !== "Livre" && order.statut !== "Ranbouse") {

      if (driver.sellerBoss.some(item => item.sellerId === sellerId)) {
        seller.balance += (order.totalPrice - order.feeShipping)
        return res.status(200).send({ sellerBalance, orderStatut })
      } else {
        seller.balance += (order.totalPrice - (order.feeShipping * 2))
        driver.balance += order.feeShipping
        return res.status(200).send({ sellerBalance, orderStatut, driverBalance })
      }

    }

    if (order.freeShipping === false && order.statut !== "Livre" && order.statut !== "Ranbouse") {

      if (driver.sellerBoss.some(item => item.sellerId === sellerId)) {
        seller.balance += order.totalPrice
        return res.status(200).send({ sellerBalance, orderStatut })
      } else {
        seller.balance += (order.totalPrice - order.feeShipping)
        driver.balance += order.feeShipping
        return res.status(200).send({ sellerBalance, orderStatut, driverBalance })
      }
    }


    order.statut = "Livre"

    const sellerBalance = seller.balance
    const orderStatut = order.statut
    const driverBalance = seller.balance

    await seller.save()
    await order.save()
    await driver.save()

    res.status(201).send({ sellerBalance, orderStatut, Message: "Transaction deja excute" })

  } catch (error) {
    console.log(error)
    res.status(500).send({ Message: "Payment not confirmed" })
  }
}



