import mongoose from "mongoose";


//Review 
const reviewScheam = new mongoose.Schema({
    selectedColor: {
        type: String,
        require: true
    },
    selectedSize: {
        type: String,
    },
    nameProduct: {
        type: String,
    },
    productId: {
        type: String,
    },
    name: {
        type: String,
        require: true
    },
    rating: {
        type: Number,
        default: 0,
    },
    comment: {
        type: String,
    },
    userId: {
        type: String,
        require: true
    },

}, { timestamps: true })

//Product Schema
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    productId: {
        type: String,
        required: true,
        unique: true
    },
    rating: {
        type: Number,
        required: true
    },
    sellerId: {
        type: String,
        required: true,
        unique: true
    },
    phoneSeller: {
        type: String,
    },
    coordinateSeller: {
        latitude: {
            type: Number,
            require: true
        },
        longitude: {
            type: Number,
            require: true
        }
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
    details: {
        type: String,
    },
    promo: {
        type: Boolean,
        default: false
    },
    discount: {
        type: Boolean,
        default: false
    },
    flashSale: {
        type: Boolean,
        default: false
    },
    verifiedAddress: {
        type: Boolean,
        default: false
    },
    freeShipping: {
        type: Boolean,
        default: false
    },
    feeShipping: {
        type: String,
        default: "0"
    },
    dateShipping: {
        type: String,
    },
    seeColor: {
        type: Boolean,
        default: true
    },
    seeSize: {
        type: Boolean,
        default: true
    },
    products: [
        {
            caroussel: [
                String
            ],

            productsId: {
                type: String
            },
            sizes: [
                {
                    price: {
                        type: Number,
                        required: true,
                        default: 0
                    },
                    oldPrice: {
                        type: Number,
                        default: 0
                    },
                    promo: {
                        type: String
                    },
                    size: {
                        type: String,
                        default: "OneSize"
                    },
                    dispo: {
                        type: Number,
                        default: 999
                    },
                    state: {
                        type: String
                    },
                    discounts: [
                        {
                            qtyDiscount: {
                                type: Number,
                            },
                            discount: {
                                type: Number,
                            },
                        },
                    ],

                }
            ],
            parentColor: {
                type: String
            },

        },
    ],
    reviews: [reviewScheam],
    rating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0,
    },
    viewOnStore: {
        type: Boolean,
        default: true
    },
    adsProduct: {
        type: Boolean,
        default: false
    },
    adsProductCreated: {
        type: Date,
        default: Date.now()
    },
    adsProductExpired: {
        type: Date,
    },
    views: {
        type: Number,
        default: 0,
    },
    viewsHistory: [
        {
            userId: {
                type: String
            },
            date: {
                type: Date,
                default: Date.now,
            },
        }
    ],
    sales: {
        type: Number,
        default: 0,
    },
    salesHistory: [
        {
            date: {
                type: Date,
                default: Date.now,
            },
            quantity: Number,
            salePrice: Number,
        }
    ],
}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);

export default Product
