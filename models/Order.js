import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    name: {
        type: String,
    },
    feeVerified: {
        type: Boolean,
        default: false,
    },
    feeShipping: {
        type: Number,
        require: true,
    },
    freeShipping: {
        type: Boolean,
        default: false,
        require: true,
    },
    searchDriver: {
        type: Boolean,
        default: true,
        require: true,
    },
    totalPrice: {
        type: Number,
        required: true
    },
    codePromo: {
        type: Boolean,
        default: false
    },
    promoDiscount: {
        type: Number,
        default: 0
    },
    sellerId: {
        type: String,
        require: true
    },
    sellerName: {
        type: String
    },
    products:
        [
            {
                productId: {
                    type: String,
                    require: true
                },
                sellerId: {
                    type: String,
                },
                title: {
                    type: String,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
                price: {
                    type: Number,
                    required: true
                },
                oldPrice: {
                    type: Number,
                },
                image: {
                    type: String,
                    // require: true,
                },
                selectedColor: {
                    type: String,
                    required: true
                },
                selectedSize: {
                    type: String,
                    required: true
                },
                category: {
                    type: String,
                    required: true
                },
                subCategory: {
                    type: String,
                    required: true
                },
                subSubCategory: {
                    type: String,
                    required: true
                },
                dateShipping: {
                    type: String,
                },
                cartId: {
                    type: String,
                    require: true,
                    unique: true
                },
                productsId: {
                    type: String,
                    require: true,
                },

            },
        ],
    statut: {
        type: String,
        default: "Kòmand plase"
    },
    ShippingAddress:
        [
            {
                name: {
                    type: String,
                    required: true
                },
                mobileNo: {
                    type: String,
                    required: true
                },
                postalCode: {
                    type: String,
                    required: true
                },
                city: {
                    type: String,
                    required: true
                },
                district: {
                    type: String,
                    default: ''
                },
                departement: {
                    type: String,
                    required: true
                },
                country: {
                    type: String,
                    required: true
                },
                street: {
                    type: String,
                    required: true
                },
                streetNumber: {
                    type: String,
                },
                type: {
                    type: String,
                    required: true
                },
                details: {
                    type: String,
                },
                longitude: {
                    type: Number,
                },
                latitude: {
                    type: Number
                },
            },
        ],
    orderId: {
        type: String,
        require: true,
        unique: true
    },
    paymentId: {
        type: String,
        require: true,
        unique: true
    },
    driverId: {
        type: String,
        default: ''
    },
    paymentMethod: {
        type: String,
        required: true
    },
    details: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});


const Order = mongoose.model("Order", orderSchema);

export default Order