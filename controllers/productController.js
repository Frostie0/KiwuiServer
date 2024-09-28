import Carou from "../models/Carou.js";
import Product from "../models/Products.js";
import Seller from "../models/Sellers.js";
import User from "../models/user.js";
import Order from "../models/Order.js";
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadProductImageController = async (req, res) => {
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

//post Product
export const postProductController = async (req, res) => {
    try {
        const { product } = req.body;

        if (!product) {
            return res.status(400).send({ Message: "Product is required" });
        }

        const sellerId = product.sellerId;

        const seller = await Seller.findOne({ sellerId });

        if (!seller) {
            return res.status(400).send({ Message: "seller not find" });
        }

        const products = product.products

        for (const singleProduct of products) {
            const { sizes } = singleProduct;

            for (const item of sizes) {
                const { price, discounts, oldPrice, size } = item;

                if (oldPrice > price) {
                    item.promo = Math.floor((1 - parseInt(price) / parseInt(oldPrice)) * 100);
                } else {
                    item.promo = 0;
                }

                item.size = item.size.toUpperCase()

                for (const item2 of discounts) {
                    const { discount, qtyDiscount } = item2;

                    const newDiscount = (price - (discount / qtyDiscount));
                    item2.discount = newDiscount;
                }
            }
        }


        const coordinateSeller = seller.coordinate;
        const phoneSeller = seller.phone;

        product.coordinateSeller = coordinateSeller;
        product.phoneSeller = phoneSeller;

        const newProduct = await Product.create(product);

        const productSeller = seller.product;
        productSeller.push(product.productId);

        await seller.save()

        res.status(200).json(newProduct);

    } catch (error) {
        console.error(error);
        res.status(500).send({ Message: "Error posting product" });
    }
};


export const updateProductController = async (req, res) => {
    const { newProduct } = req.body;

    try {
        const oldProduct = await Product.findOne({ productId: newProduct.productId });

        if (!oldProduct) {
            return res.status(404).send({ message: 'No product found with this productId.' });
        }

        for (const item of oldProduct.products) {
            const { caroussel } = item

            for (let imageUrl of caroussel) {
                const urlParts = imageUrl.split('/');
                const id = urlParts[urlParts.length - 1].split('.')[0];

                await cloudinary.uploader.destroy(id, function (error, result) {
                    if (error) {
                        console.error("Erreur lors de la suppression de l'image :", error);
                        throw error;
                    }
                    console.log(result);
                });
            }

        }

        const products = newProduct.products

        for (const singleProduct of products) {
            const { sizes } = singleProduct;

            for (const item of sizes) {
                const { price, discounts, oldPrice } = item;

                if (oldPrice > price) {
                    item.promo = Math.floor((1 - parseInt(price) / parseInt(oldPrice)) * 100);
                } else {
                    item.promo = 0;
                }

                item.size = item.size.toUpperCase()

                for (const item2 of discounts) {
                    const { discount, qtyDiscount } = item2;

                    const newDiscount = (price - (discount / qtyDiscount));
                    item2.discount = newDiscount;
                }
            }
        }


        oldProduct.products = newProduct.products;
        oldProduct.title = newProduct.title;
        oldProduct.sellerId = newProduct.sellerId;
        oldProduct.category = newProduct.category;
        oldProduct.subCategory = newProduct.subCategory;
        oldProduct.subSubCategory = newProduct.subSubCategory;
        oldProduct.details = newProduct.details;
        oldProduct.feeShipping = newProduct.feeShipping;
        oldProduct.freeShipping = newProduct.freeShipping;
        oldProduct.dateShipping = newProduct.dateShipping;
        oldProduct.verifiedAddress = newProduct.verifiedAddress;
        oldProduct.promo = newProduct.promo;
        oldProduct.flashSales = newProduct.flashSales;
        oldProduct.discount = newProduct.discount;
        oldProduct.seeColor = newProduct.seeColor;
        oldProduct.seeSize = newProduct.seeSize;



        await oldProduct.save()

        res.status(200).send({ message: 'Product and associated images updated successfully', product: oldProduct });
    } catch (error) {
        console.log(error)
        res.status(500).send({ error: error.message });
    }
};


export const deleteProductController = async (req, res) => {
    const { productId } = req.params;

    try {
        const product = await Product.findOne({ productId });

        if (!product) {
            return res.status(404).send({ message: 'No product found with this productId.' });
        }

        const sellerId = product.sellerId
        const seller = await Seller.findOne({ sellerId })
        const products = product.products

        for (const item of products) {
            const { caroussel } = item

            for (let imageUrl of caroussel) {
                const urlParts = imageUrl.split('/');
                const id = urlParts[urlParts.length - 1].split('.')[0];

                await cloudinary.uploader.destroy(id, function (error, result) {
                    if (error) {
                        console.error("Erreur lors de la suppression de l'image :", error);
                        throw error;
                    }
                    console.log(result);
                });
            }
        }

        const productSeller = seller.product
        const productIndex = productSeller.findIndex(item => item === productId)

        if (productIndex !== -1) {
            productSeller.splice(productIndex, 1)
        }

        await seller.save()
        await Product.deleteOne({ productId });

        res.status(200).send({ message: 'Product and associated images deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};



//getProduct
export const getProductController = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ userId })

        let productList = await Product.find({})

        const carou = await Carou.find({})

        if (!user) {
            return res.status(201).json({ productList, carou })
        }

        const preferences = user.preferences

        // Trier les produits en fonction des préférences de l'utilisateur et de la valeur de adsProduct
        productList.sort((a, b) => {
            const aIndex = preferences.indexOf(a.subSubCategory);
            const bIndex = preferences.indexOf(b.subSubCategory);

            // Mettre en avant les produits dont adsProduct est true et qui font partie des préférences
            if (a.adsProduct && aIndex !== -1 && (!b.adsProduct || bIndex === -1)) {
                return -1;
            } else if (b.adsProduct && bIndex !== -1 && (!a.adsProduct || aIndex === -1)) {
                return 1;
            }

            // Ensuite, trier en fonction des préférences
            if (aIndex === -1 && bIndex === -1) {
                return 0; // Les deux produits ne sont pas dans les préférences, donc ils sont égaux
            } else if (aIndex === -1) {
                return 1; // Le produit a n'est pas dans les préférences, donc il vient après
            } else if (bIndex === -1) {
                return -1; // Le produit b n'est pas dans les préférences, donc il vient après
            } else {
                return aIndex - bIndex; // Les deux produits sont dans les préférences, donc nous les trions en fonction de leur ordre
            }
        });

        res.status(200).json({ productList, carou })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Product retrieval failed" })
    }
};

export const getProductFilteredController = async (req, res) => {
    try {
        const { userId, type } = req.body;

        const user = await User.findOne({ userId })

        let productList = await Product.find({})

        if (type === "Promotion") {

            let productFiltered = productList.filter(item => item.promo === true)

            if (!user) {
                return res.status(201).json({ productFiltered })
            }

            const preferences = user.preferences

            productFiltered.sort((a, b) => {
                const aIndex = preferences.indexOf(a.subSubCategory);
                const bIndex = preferences.indexOf(b.subSubCategory);

                // Mettre en avant les produits dont adsProduct est true et qui font partie des préférences
                if (a.adsProduct && aIndex !== -1 && (!b.adsProduct || bIndex === -1)) {
                    return -1;
                } else if (b.adsProduct && bIndex !== -1 && (!a.adsProduct || aIndex === -1)) {
                    return 1;
                }

                // Ensuite, trier en fonction des préférences
                if (aIndex === -1 && bIndex === -1) {
                    return 0; // Les deux produits ne sont pas dans les préférences, donc ils sont égaux
                } else if (aIndex === -1) {
                    return 1; // Le produit a n'est pas dans les préférences, donc il vient après
                } else if (bIndex === -1) {
                    return -1; // Le produit b n'est pas dans les préférences, donc il vient après
                } else {
                    return aIndex - bIndex; // Les deux produits sont dans les préférences, donc nous les trions en fonction de leur ordre
                }
            });

            res.status(200).json({ productFiltered })
        }

        else if (type === "Discount") {

            let productFiltered = productList.filter(item => item.discount === true)

            if (!user) {
                return res.status(201).json({ productFiltered })
            }

            const preferences = user.preferences

            productFiltered.sort((a, b) => {
                const aIndex = preferences.indexOf(a.subSubCategory);
                const bIndex = preferences.indexOf(b.subSubCategory);

                // Mettre en avant les produits dont adsProduct est true et qui font partie des préférences
                if (a.adsProduct && aIndex !== -1 && (!b.adsProduct || bIndex === -1)) {
                    return -1;
                } else if (b.adsProduct && bIndex !== -1 && (!a.adsProduct || aIndex === -1)) {
                    return 1;
                }

                // Ensuite, trier en fonction des préférences
                if (aIndex === -1 && bIndex === -1) {
                    return 0; // Les deux produits ne sont pas dans les préférences, donc ils sont égaux
                } else if (aIndex === -1) {
                    return 1; // Le produit a n'est pas dans les préférences, donc il vient après
                } else if (bIndex === -1) {
                    return -1; // Le produit b n'est pas dans les préférences, donc il vient après
                } else {
                    return aIndex - bIndex; // Les deux produits sont dans les préférences, donc nous les trions en fonction de leur ordre
                }
            });

            res.status(200).json({ productFiltered })
        }

        else if (type === "FreeShipping") {

            let productFiltered = productList.filter(item => item.freeShipping === true)

            if (!user) {
                return res.status(201).json({ productFiltered })
            }

            const preferences = user.preferences

            productFiltered.sort((a, b) => {
                const aIndex = preferences.indexOf(a.subSubCategory);
                const bIndex = preferences.indexOf(b.subSubCategory);

                // Mettre en avant les produits dont adsProduct est true et qui font partie des préférences
                if (a.adsProduct && aIndex !== -1 && (!b.adsProduct || bIndex === -1)) {
                    return -1;
                } else if (b.adsProduct && bIndex !== -1 && (!a.adsProduct || aIndex === -1)) {
                    return 1;
                }

                // Ensuite, trier en fonction des préférences
                if (aIndex === -1 && bIndex === -1) {
                    return 0; // Les deux produits ne sont pas dans les préférences, donc ils sont égaux
                } else if (aIndex === -1) {
                    return 1; // Le produit a n'est pas dans les préférences, donc il vient après
                } else if (bIndex === -1) {
                    return -1; // Le produit b n'est pas dans les préférences, donc il vient après
                } else {
                    return aIndex - bIndex; // Les deux produits sont dans les préférences, donc nous les trions en fonction de leur ordre
                }
            });

            res.status(200).json({ productFiltered })
        }

        else if (type === "NewArrivals") {

            let productFiltered = productList.filter(item => Date.parse(item.createdAt) > Date.now() - 7 * 24 * 60 * 60 * 1000)

            if (!user) {
                return res.status(201).json({ productFiltered })
            }

            const preferences = user.preferences

            productFiltered.sort((a, b) => {
                const aIndex = preferences.indexOf(a.subSubCategory);
                const bIndex = preferences.indexOf(b.subSubCategory);

                // Mettre en avant les produits dont adsProduct est true et qui font partie des préférences
                if (a.adsProduct && aIndex !== -1 && (!b.adsProduct || bIndex === -1)) {
                    return -1;
                } else if (b.adsProduct && bIndex !== -1 && (!a.adsProduct || aIndex === -1)) {
                    return 1;
                }

                // Ensuite, trier en fonction des préférences
                if (aIndex === -1 && bIndex === -1) {
                    return 0; // Les deux produits ne sont pas dans les préférences, donc ils sont égaux
                } else if (aIndex === -1) {
                    return 1; // Le produit a n'est pas dans les préférences, donc il vient après
                } else if (bIndex === -1) {
                    return -1; // Le produit b n'est pas dans les préférences, donc il vient après
                } else {
                    return aIndex - bIndex; // Les deux produits sont dans les préférences, donc nous les trions en fonction de leur ordre
                }
            });

            res.status(200).json({ productFiltered })
        }

        else if (type === "Deal") {

            let productFiltered = productList.filter(item => item.flashSale === true)

            if (!user) {
                return res.status(201).json({ productFiltered })
            }

            const preferences = user.preferences

            productFiltered.sort((a, b) => {
                const aIndex = preferences.indexOf(a.subSubCategory);
                const bIndex = preferences.indexOf(b.subSubCategory);

                // Mettre en avant les produits dont adsProduct est true et qui font partie des préférences
                if (a.adsProduct && aIndex !== -1 && (!b.adsProduct || bIndex === -1)) {
                    return -1;
                } else if (b.adsProduct && bIndex !== -1 && (!a.adsProduct || aIndex === -1)) {
                    return 1;
                }

                // Ensuite, trier en fonction des préférences
                if (aIndex === -1 && bIndex === -1) {
                    return 0; // Les deux produits ne sont pas dans les préférences, donc ils sont égaux
                } else if (aIndex === -1) {
                    return 1; // Le produit a n'est pas dans les préférences, donc il vient après
                } else if (bIndex === -1) {
                    return -1; // Le produit b n'est pas dans les préférences, donc il vient après
                } else {
                    return aIndex - bIndex; // Les deux produits sont dans les préférences, donc nous les trions en fonction de leur ordre
                }
            });

            res.status(200).json({ productFiltered })
        }

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: 'Product not filtered' })
    }
}

//get ProductId
export const getProductInfoController = async (req, res) => {
    try {
        const { productId } = req.params

        const productList = await Product.findOne({ productId })

        res.status(200).json({ productList })

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "error fetching" })
    }
}



// //post like 
// export const postWishlistController = async (req, res) => {
//     try {
//         const { productId, userId } = req.body

//         const existingProduct = await Wishlist.findOne({ productId })

//         if (existingProduct) {
//             res.status(400).send({ message: "Product already existing" })
//         }
//         const product = await Wishlist.create({ productId });

//         res.status(201).send({
//             succes: true,
//             message:
//                 "Wislist Create successful.",
//             product,
//         });


//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "Wishlist dont create" })
//     }
// }

// //get like 
// export const getWishlistController = async (req, res) => {
//     try {
//         const { productId, userId } = req.body

//         const wishlist = await Wishlist.findOne({ productId })

//         let statut = false;
//         wishlist.likes.map(item => {
//             if (item === userId) {
//                 statut = true;
//             } else {
//                 statut = false
//             }
//         });

//         res.status(200).json({ message: "WishList find", statut })

//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "Wishlist dont get" })
//     }
// }

//update like and dislikes
// export const updateWishlistController = async (req, res) => {
//     try {
//         const { productId, userId } = req.body;

//         const product = await Wishlist.findOne({ productId })

//         let tempLikes = product.likes;
//         let userLiked = false;

//         for (const like of tempLikes) {
//             if (userId === like) {
//                 userLiked = true;
//                 const index = tempLikes.indexOf(like);
//                 if (index > -1) {
//                     tempLikes.splice(index, 1);
//                 }
//                 break;
//             }
//         }

//         if (!userLiked) {
//             tempLikes.push(userId);
//         }

//         product.likes = tempLikes;



//         await product.save()

//         res.status(201).json({ message: "update like is successfully" })

//     } catch (error) {
//         res.status(500).json({ message: "update like dont make" })
//     }
// };


export const productDispoController = async (req, res) => {
    try {

        const { cartItems } = req.body;

        for (const cartItem of cartItems) {
            const { productId, productsId, size, quantity } = cartItem;

            const existingProduct = await Product.findOne({ productId });

            if (existingProduct) {
                const selectedProduct = existingProduct.products.find(product => product.productsId === productsId);

                if (selectedProduct) {
                    const selectedSize = selectedProduct.sizes.find(productSize => productSize.size === size);

                    if (selectedSize && selectedSize.dispoQuantity > 0) {
                        selectedSize.dispoQuantity -= quantity;
                        await existingProduct.save();
                    }
                }
            }
        }




    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "product Dispo dont Update" })
    }
}

//get WishList
export const getWishList = async (req, res) => {
    try {
        const { WishListProduct } = req.body


        // const wishlist = await Wishlist.find({})

        // const WishListProduct = []

        // for (const item of wishlist) {
        //     const product = item.productId
        //     const likes = item.likes
        //     const userLikeExisting = likes.includes(userId)

        //     if (userLikeExisting) {
        //         WishListProduct.push(product)
        //     }
        // }

        const productWishList = []

        for (const item of WishListProduct) {

            const productId = item
            const product = await Product.findOne({ productId })

            if (product) {
                productWishList.push(product)
            }

        }

        res.status(200).send({ productWishList })

    } catch (error) {
        console.log(error)
        res.status(500).send({ error })
    }
}

//searchProduct
export const searchProductController = async (req, res) => {
    try {
        const { text } = req.body;

        // Validation des données d'entrée
        if (!text || typeof text !== 'string') {
            return res.status(400).send({ message: "Veuillez fournir un texte de recherche valide." });
        }

        const product = await Product.find({})

        if (text) {
            const newData = product.filter(item => {
                const itemData = item.title ? item.title.toUpperCase() : ''.toUpperCase();
                const textData = text.toUpperCase();
                return itemData.indexOf(textData) > -1
            })
            res.status(200).send({ products: newData });
        }


    } catch (error) {
        console.error("Erreur lors de la recherche de produits :", error);
        res.status(500).send({ message: "Une erreur s'est produite lors de la recherche de produits." });
    }
};

//product subSubCategory
export const getSubSubCategory = async (req, res) => {
    try {
        const { subSubCategory, subCategory2 } = req.body;

        const product = await Product.find({});

        const productList = product.filter(item => item.subCategory === subCategory2 && item.subSubCategory === subSubCategory)

        res.status(200).json({ productList });
    } catch (error) {
        console.log(error);
        res.status(500).json({ erreur: "Erreur interne du serveur" });
    }
};

export const getSubCategory = async (req, res) => {
    try {
        const { subCategory } = req.body;

        const product = await Product.find({});

        const productList = product.filter(item => item.subCategory === subCategory)

        res.status(200).send({ productList });
    } catch (error) {
        console.log(error);
        res.status(500).json({ erreur: "Erreur interne du serveur" }); // Correction du statut de réponse et du format
    }
};

export const getSellerProduct = async (req, res) => {
    try {
        const { sellerId } = req.params;

        const product = await Product.find({});

        const productList = product.filter(item => item.sellerId === sellerId)

        res.status(200).send({ productList });
    } catch (error) {
        console.log(error);
        res.status(500).json({ erreur: "Erreur interne du serveur" }); // Correction du statut de réponse et du format
    }
};

export const searchProductSellerController = async (req, res) => {
    try {
        const { sellerId } = req.params
        const { text } = req.body;

        // Validation des données d'entrée
        if (!text || typeof text !== 'string') {
            return res.status(400).send({ message: "Veuillez fournir un texte de recherche valide." });
        }

        const product = await Product.find({ sellerId })

        if (text) {
            const newData = product.filter(item => {
                const itemData = item.title ? item.title.toUpperCase() : ''.toUpperCase();
                const textData = text.toUpperCase();
                return itemData.indexOf(textData) > -1
            })
            res.status(200).send({ products: newData });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ erreur: "Erreur interne du serveur" });
    }
}

export const postAdsProductController = async (req, res) => {
    try {
        const { productId, sellerId, adsDayQuantity } = req.body;

        const product = await Product.findOne({ productId });
        const seller = await Seller.findOne({ sellerId });

        if (!product) {
            return res.status(404).send({ Message: "Produit introuvable" });
        }

        if (!seller) {
            return res.status(404).send({ Message: "Vendeur introuvable" });
        }

        if (seller.adsProduct >= adsDayQuantity) {
            seller.adsProduct -= adsDayQuantity;
            product.adsProductCreated = Date.now();
            product.adsProductExpired = Date.now() + parseInt(adsDayQuantity) * 1 * 1 * 1 * 1;
            product.adsProduct = true;

            await product.save();
            await seller.save();
            res.status(200).send({ Message: "Publicité créée avec succès" });
        } else {
            res.status(400).send({ Message: "Solde insuffisant" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ Message: "La publicité n'a pas pu être créée pour le produit" });
    }
};

export const updateProductViewsController = async (req, res) => {
    try {
        const { productId } = req.params;
        const { userId } = req.body;

        if (!productId) {
            return res.status(404).send({ Message: "Product ID not provided" })
        }

        const product = await Product.findOne({ productId })

        if (!product) {
            return res.status(404).send({ Message: "Product not found" })
        }

        product.views += 1;
        product.viewsHistory.push({ userId, date: Date.now() });

        const user = await User.findOne({ userId })

        if (!user) {
            return res.status(404).send({ Message: "User not found" })
        }

        const { subSubCategory } = product;

        if (!user.preferences.includes(subSubCategory)) {
            user.preferences.push(subSubCategory);
            await user.save();
        }

        await product.save()

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "Product update failed" })
    }
};

export const getUserViewedProductsController = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(404).send({ Message: "User ID not provided" })
        }

        const userViewedProducts = await Product.find({ 'viewsHistory.userId': userId })

        if (!userViewedProducts) {
            return res.status(404).send({ Message: "No viewed products found for this user" })
        }

        res.status(200).json({ userViewedProducts })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Viewed products retrieval failed" })
    }
};

export const getNonCommentary = async (req, res) => {
    try {
        const { userId } = req.params;

        const order = await Order.find({ userId: userId, statut: "Livre" });

        const productList = []

        for (const item of order) {
            const products = item.products
            const sellerId = item.sellerId

            for (const item2 of products) {

                const productId = item2.productId
                const productOrder = item2

                const product = await Product.findOne({ productId })

                if (!product.reviews.find((i) => i.userId.toString() === userId.toString())) {
                    const productWithSeller = productOrder
                    productList.push(productWithSeller);
                }

            }
        }

        res.status(200).send({ productList });

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "commentary not find" })
    }
}

export const productReviewController = async (req, res) => {
    try {
        const { comment, rating, userId, productId, selectedColor, nameProduct, selectedSize, sellerId } = req.body

        //find Product
        const product = await Product.findOne({ productId })

        const user = await User.findOne({ userId })

        // //find Seller
        const seller = await Seller.findOne({ sellerId })

        // check previous review
        const alreadyReviewed = product.reviews.find((i) => i.userId.toString() === userId.toString())

        if (alreadyReviewed) {
            return res.status(400).send({
                messsage: "this user have already send a reviews"
            })
        }

        const name = user.name
        //review object
        const review = {
            selectedColor,
            selectedSize,
            nameProduct: nameProduct,
            name: name,
            rating: Number(rating),
            comment,
            userId: userId,
            productId: productId
        }

        //send review object to array reviews
        product.reviews.push(review)

        //number review of product
        product.numReviews = product.reviews.length

        //rating of product
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length


        const productSellerId = seller.product
        const productSellerNumReviews = seller.product.length;
        let productSellerRating = 0

        for (const item of productSellerId) {
            const productId = item
            const productSeller = await Product.findOne({ productId })

            if (productSeller) {
                const productRating = productSeller.rating
                productSellerRating += productRating
            }
        }

        if (productSellerNumReviews > 0) {
            seller.rating = productSellerRating / productSellerNumReviews;
        } else {
            seller.rating = 0; // ou une autre valeur par défaut
        }

        //Save info
        await product.save()
        await seller.save()

        res.status(200).send({
            mesage: "Review added"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "commentaire dont send" })
    }
}

export const getYesCommentary = async (req, res) => {
    try {
        const { userId } = req.params

        const product = await Product.find({ "reviews.userId": userId })

        const commentary = []

        for (const item of product) {
            const reviews = item.reviews

            for (const item2 of reviews) {
                if (item2.userId === userId) {
                    commentary.push(item2)
                }
            }
        }

        res.status(200).send({ commentary })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "commentary not existed" })
    }
}

export const updateCommentary = async (req, res) => {
    try {
        const { comment, rating, productId, reviewId } = req.body;

        const product = await Product.findOne({ productId });
        const review = product.reviews.find(review => review._id.toString() === reviewId)

        if (!review) {
            return res.status(404).send({ message: "Review not found" });
        }

        review.comment = comment;
        review.rating = rating;


        if (product.reviews.length > 0) {
            let totalRating = 0;
            for (const review of product.reviews) {
                totalRating += review.rating;
            }

            product.rating = totalRating / product.reviews.length;
        } else {
            product.rating = 0;
        }


        await product.save();

        res.status(200).send({ message: "Review and product rating updated successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error updating review" });
    }
}


export const deleteCommentary = async (req, res) => {
    try {
        const { productId, reviewId } = req.body;

        const product = await Product.findOne({ productId });

        if (!product) {
            return res.status(404).send({ message: "Product not found" });
        }

        const reviewIndex = product.reviews.findIndex(review => review._id.toString() === reviewId);

        if (reviewIndex === -1) {
            return res.status(404).send({ message: "Review not found" });
        }

        product.reviews.splice(reviewIndex, 1);


        if (product.reviews.length > 0) {
            let totalRating = 0;
            for (const review of product.reviews) {
                totalRating += review.rating;
            }

            product.rating = totalRating / product.reviews.length;
        } else {
            product.rating = 0;
        }

        product.numReviews = product.reviews.length

        await product.save();

        res.status(200).send({ message: "Review deleted successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error deleting review" });
    }
}

export const getSellerReviews = async (req, res) => {
    try {
        const { sellerId } = req.params;

        const products = await Product.find({ sellerId });

        const reviews = [];

        for (const product of products) {
            for (const review of product.reviews) {
                reviews.push(review);
            }
        }

        res.status(200).send({ reviews });

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error getting reviews" });
    }
}


export const getProductCountsController = async (req, res) => {
    try {
        const products = await Product.find();
        const counts = {};

        for (const product of products) {
            const key = `${product.category}-${product.subCategory}-${product.subSubCategory}`;
            if (!counts[key]) {
                counts[key] = {
                    category: product.category,
                    subCategory: product.subCategory,
                    subSubCategory: product.subSubCategory,
                    productCount: 0
                };
            }
            counts[key].productCount += 1; // Augmente le compteur pour chaque produit unique dans la sous-sous-catégorie
        }

        const result = [];
        for (const key in counts) {
            result.push(counts[key]);
        }

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get product counts" });
    }
};

