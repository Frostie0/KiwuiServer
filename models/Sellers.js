import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema({
    sellerId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        // unique: [true, 'email is already taken']
    },
    password: {
        type: String,
        required: [true, 'password is required'],
        // minLength: [6, 'password length should be greather than 6 character']
    },
    completedAddress: {
        type: Boolean,
        default: false
    },
    completedFilter: {
        type: Boolean,
        default: false
    },
    profile: {
        type: String,
        default: ""
    },
    shippingZone: [

    ],
    departement: {
        type: String,
        // required: true
    },
    city: {
        type: String,
        // required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    tokenSeller: {
        type: String
    },
    rating: {
        type: Number,
        default: 0
    },
    adsProduct: {
        type: Number,
        default: 0
    },
    adsCarou: {
        type: Number,
        default: 0
    },
    dashboard: {
        type: Boolean,
        default: true
    },
    niv: {
        type: Number,
        default: 1
    },
    nivCreatedDate: {
        type: Date,
        default: Date.now(),
    },
    nivExpiredDate: {
        type: Date,
        default: Date.now() + 29 * 24 * 60 * 60 * 1000
    },
    driverEmployed: [
        String
    ],
    product: [
        {
            type: String
        }
    ],
    productMax: {
        type: Number,
        default: 250
    },
    followers: [
        String
    ],
    viewOnMap: {
        type: Boolean,
        default: false
    },
    address: {
        sellerId: {
            type: String,
            require: true
        },
        country: {
            type: String,
            require: true
        },
        departement: {
            type: String,
            require: true
        },
        postalCode: {
            type: String,
            require: true,
        },
        city: {
            type: String,
            require: true
        },
        details: {
            type: String
        },
        street: {
            type: String,
            require: true
        },
        streetNumber: {
            type: String,
        },
        district: {
            type: String,
            require: true
        },
        addressId: {
            type: String,
            require: true,
            unique: true
        },
        verified: {
            type: Boolean,
            default: false
        },
    },
    coordinate: {
        latitude: {
            type: Number,
            require: true
        },
        longitude: {
            type: Number,
            require: true
        }
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
}, { timestamps: true });

export const Seller = mongoose.model("Seller", sellerSchema);

export default Seller
