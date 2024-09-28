import mongoose from "mongoose";


const cartSchema = new mongoose.Schema({
    sellerId: {
        type: String,
        require: true
    },
    userId: {
        type: String,
        require: true
    },
    verifiedAddress: {
        type: Boolean,
        default: false
    },
    latitude: {
        type: Number,
        require: true
    },
    longitude: {
        type: Number,
        require: true
    },
    carts: [
        {
            productId: {
                type: String,
                require: true
            },
            freeShipping: {
                type: Boolean,
                default: false
            },
            feeShipping: {
                type: String
            },
            dateShipping: {
                type: String
            },
            sellerId: {
                type: String,
                require: true
            },
            title: {
                type: String,
                require: true
            },
            price:
            {
                type: Number,
                require: true
            },
            image:
            {
                type: String,
                require: true
            },
            quantity: {
                type: Number,
            },
            category: {
                type: String,
                require: true
            },
            subCategory: {
                type: String,
                require: true
            },
            subSubCategory: {
                type: String,
                required: true
            },
            selectedColor: {
                type: String,
                require: true
            },
            selectedSize: {
                type: String,
                require: true
            },
            discounts: [
                {
                    oldPrice: {
                        type: Number,
                    },
                    qtyDiscount: {
                        type: Number,
                    },
                    discount: {
                        type: Number,
                    },
                }
            ],
            dispoQuantity: {
                type: Number,
                require: true
            },
            cartId: {
                type: String,
                require: true
            },
            productsId:
            {
                type: String,
                require: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
        }
    ],

})

export const Cart = mongoose.model("Cart", cartSchema);

export default Cart