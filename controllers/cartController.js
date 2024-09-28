import Cart from '../models/Carts.js'
import Product from '../models/Products.js';
import Seller from '../models/Sellers.js';


export const getCartsController = async (req, res) => {
    try {
        const { userId } = req.params;

        const cartList = await Cart.find({ userId });

        const cartUpdates = cartList.map(cart => ({
            carts: cart.carts.map(item => ({
                cartId: item.cartId,
                productsId: item.productsId,
                quantity: item.quantity,
                quantityDispo: item.dispoQuantity
            }))
        }));

        return res.status(200).send({ cartUpdates, cartList });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Une erreur s'est produite lors de la récupération des paniers." });
    }
}

export const sendCartController = async (req, res) => {
    try {
        const { dispoQuantity, userId, productId, title, price, image, verifiedAddress,
            discountsMap, productsIdCart, category, subCategory, subSubCategory, freeShipping, feeShipping, dateShipping,
            selectedColor, selectedSize, cartId, sellerId, coordinateSeller, sellerName, quantity } = req.body;


        const cartFind = await Cart.findOne({ sellerId, userId });

        const productsId = productsIdCart[0]

        if (!cartFind) {

            const latitude = coordinateSeller.latitude;
            const longitude = coordinateSeller.longitude;

            const newProduct = {
                sellerId: sellerId,
                title: title,
                price: price,
                image: image,
                quantity: quantity,
                category: category,
                subCategory: subCategory,
                subSubCategory: subSubCategory,
                selectedColor: selectedColor,
                selectedSize: selectedSize,
                discounts: discountsMap.map((item) => ({
                    qtyDiscount: item?.qtyDiscount,
                    discount: item?.discount
                })),
                dispoQuantity: dispoQuantity,
                cartId: cartId,
                productsId: productsId,
                productId: productId,
                freeShipping: freeShipping,
                feeShipping: feeShipping,
                dateShipping: dateShipping
            };

            const carts = [newProduct]

            const newCart = await Cart.create({
                userId,
                sellerId,
                verifiedAddress,
                longitude,
                latitude,
                sellerName,
                carts
            });

            return res.status(200).send({
                message: "Panier créé avec succès.",
                newCart
            });
        }

        if (cartFind !== null) {
            const carts = cartFind.carts;
            let updated = false;

            const cartExisting = carts.find(cart => cart.selectedColor === selectedColor &&
                cart.selectedSize === selectedSize &&
                cart.productsId === productsId);


            if (cartExisting) {
                if (cartExisting.quantity < cartExisting.dispoQuantity) {
                    cartExisting.quantity += 1;
                    updated = true;
                }

                if (updated) {
                    await cartFind.save();
                    return res.status(201).send({ message: "Le panier a été mis à jour avec succès." });
                } else {
                    return res.status(202).send({ message: "Aucune mise à jour nécessaire, le panier reste inchangé." });
                }
            } else {
                const newProduct = {
                    sellerId: sellerId,
                    title: title,
                    price: price,
                    image: image,
                    quantity: quantity,
                    category: category,
                    subCategory: subCategory,
                    subSubCategory: subSubCategory,
                    selectedColor: selectedColor,
                    selectedSize: selectedSize,
                    discounts: discountsMap.map((item) => ({
                        qtyDiscount: item?.qtyDiscount,
                        discount: item?.discount
                    })),
                    dispoQuantity: dispoQuantity,
                    cartId: cartId,
                    productsId: productsId,
                    productId: productId,
                    freeShipping: freeShipping,
                    feeShipping: feeShipping,
                    dateShipping: dateShipping,
                };

                carts.push(newProduct);

                await cartFind.save();

                return res.status(203).send({ message: "Un nouvel article a été ajouté au panier." });
            }


        }

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Une erreur s'est produite lors de la manipulation du panier." });
    }
}

export const increaseQuantity = async (req, res) => {
    try {
        const { cartId, userId, sellerId } = req.body;

        if (!cartId || !userId || !sellerId) {
            return res.status(400).send({ message: "Des paramètres de requête sont manquants." });
        }

        const cartFind = await Cart.findOne({ userId, sellerId });

        if (!cartFind) {
            return res.status(404).send({ message: "Le panier correspondant n'a pas été trouvé." });
        }

        const cart = cartFind.carts.find(item => item.cartId === cartId);

        if (!cart) {
            return res.status(404).send({ message: "L'article correspondant n'a pas été trouvé dans le panier." });
        }

        if (cart.quantity >= cart.dispoQuantity) {
            return res.status(201).send({ message: "La quantité maximale disponible a été atteinte.", status: 201 });
        }

        cart.quantity++;

        for (const item of cart.discounts) {
            if (cart.quantity === item.qtyDiscount) {
                item.oldPrice = cart.price;
            }
            if (item.qtyDiscount === cart.quantity) {
                cart.price -= item.discount;
            }
        }

        await cartFind.save();

        const { price, quantity, dispoQuantity } = cart;
        return res.status(200).send({
            message: "La quantité a été augmentée avec succès.",
            quantity, dispoQuantity, cartId, price, sellerId, status: 200
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Une erreur s'est produite lors de l'augmentation de la quantité." });
    }
}

export const decrementQuantity = async (req, res) => {
    try {
        const { cartId, userId, sellerId } = req.body;

        if (!cartId || !userId || !sellerId) {
            return res.status(400).send({ message: "Des paramètres de requête sont manquants." });
        }

        const cartFind = await Cart.findOne({ userId, sellerId });

        if (!cartFind) {
            return res.status(404).send({ message: "Le panier correspondant n'a pas été trouvé." });
        }

        const cart = cartFind.carts.find(item => item.cartId === cartId);

        if (cart.quantity > 1) {
            cart.quantity -= 1
        }

        for (const item of cart.discounts) {

            if (cart.quantity === item.qtyDiscount - 1) {
                cart.price = item.oldPrice
            }
        }

        const price = cart.price
        const quantity = cart.quantity
        const dispoQuantity = cart.dispoQuantity

        await cartFind.save()

        res.status(200).send({
            message: "quantity update succesfully",
            quantity, dispoQuantity, cartId, price, sellerId
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "quantity dont decrement" })
    }
}

export const deleteCart = async (req, res) => {
    try {
        const { cartId, userId, sellerId } = req.body;

        if (!cartId || !userId || !sellerId) {
            return res.status(400).send({ message: "Des paramètres de requête sont manquants." });
        }

        const cartFind = await Cart.findOne({ userId, sellerId });

        if (!cartFind) {
            return res.status(404).send({ message: "Le panier correspondant n'a pas été trouvé." });
        }

        const cartIndex = cartFind.carts.findIndex(item => item.cartId === cartId);

        if (cartIndex !== -1) {

            cartFind.carts.splice(cartIndex, 1);

            await cartFind.save();

            res.status(200).send({
                message: "Cart deleted successfully",
                success: true
            });

        } else {
            return res.status(404).send({
                message: "Cart not found",
                success: false
            });
        }

        if (cartFind.carts.length === 0) {
            await cartFind.deleteOne();
        }



    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "cart dont delete" })
    }
}

export const updateDispoQuantity = async (req, res) => {
    try {
        let { cart1 } = req.body

        const sellerList = []

        for (let item of cart1) {
            let { carts, sellerId } = item

            const seller = await Seller.findOne({ sellerId })

            sellerList.push(seller)

            for (let item1 of carts) {
                let { productId, selectedColor, selectedSize } = item1

                const product = await Product.findOne({ productId })

                const products = product.products

                const productColor = products.find(item => item.parentColor === selectedColor)

                const productCart = productColor.sizes.find(item1 => item1.size === selectedSize)

                // Mettre à jour les données du panier avec les données les plus récentes du produit
                item1.dispoQuantity = productCart.dispo
                item1.price = productCart.price
                item1.discounts = productCart.discounts
            }
        }

        res.status(200).send({ message: "dispoQuantity update", sellerList, cart1 })

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "dispoQuantity dont update" })
    }
}
