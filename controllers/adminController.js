import Carou from "../models/Carou.js";
import Product from "../models/Products.js";
import Seller from "../models/Sellers.js";
import cron from "node-cron"

cron.schedule('0 0 * * *', async () => {
    try {
  
      const allSellers = await Seller.find();
  
      for (const seller of allSellers) {
        if (seller.nivExpiredDate <= Date.now()) {
          seller.niv = 0;
          seller.productMax = 25;
          seller.dashboard  = false
          const productSeller = seller.product
  
          if (productSeller.length > 25) {
            for (let i = 25; i < seller.product.length; i++) {
              const productId = productSeller[i]
              const product = await Product.findOne({ productId })
              product.viewOnStore = false;
  
              await product.save()
            }
          }
  
          await seller.save();
        }
      }
  
      console.log('Mise à jour quotidienne des vendeurs effectuée !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des vendeurs :', error);
    }
  });

cron.schedule('0 0 * * *', async () => {
  try {
    const products = await Product.find({ adsProduct: true });

    products.forEach(async (product) => {
      const now = new Date();
      if (product.adsProductExpired && now > new Date(product.adsProductExpired)) {
        product.adsProduct = false;
        await product.save();
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des produits publicitaires expirés :', error);
  }
});

cron.schedule('0 0 * * *', async () => {
  try {
    const carousels = await Carou.find({});

    carousels.forEach(async (carousel) => {
      carousel.images.forEach(async (image) => {
        const now = new Date();
        if (image.expires && now > new Date(image.expires)) {
          const index = carousel.images.indexOf(image);
          if (index > -1) {
            carousel.images.splice(index, 1);
          }
          await carousel.save();
        }
      });
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des carrousels publicitaires expirés :', error);
  }
});


export const addImageToCarou = async (req, res) => {
  const { imageId, imageUrl, productId, adsCarou, carouId , sellerId } = req.body;

  const now = new Date();
  const expires = new Date();
  expires.setDate(now.getDate() + adsCarou); 

  const newImage = {
    sellerId:sellerId,
    imageId: imageId,
    url: imageUrl,
    productId: productId,
    created: now,
    expires: expires
  };

  try {
    const carou = await Carou.findById(carouId);
    if (!carou) {
      return res.status(404).send({ message: 'Carrousel non trouvé' });
    }
    const imageIndex = carou.pending.findIndex(image => image.imageId === imageId);
    if (imageIndex === -1) {
      return res.status(404).send({ message: 'Image non trouvée dans les images en attente' });
    }

    const image = carou.pending[imageIndex];
    image.status = "Approuval";

    carou.images.push(newImage);
   
    await carou.save();

    res.status(200).send({ message: 'Image ajoutée avec succès au carrousel' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'image au carrousel :', error);
    res.status(500).send({ message: 'Erreur lors de l\'ajout de l\'image au carrousel' });
  }
};




