import mongoose from "mongoose";

const missionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    clientId: {
        type: String,
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        // require: true,
        unique: true,
    },
    driverId: {
        type: String,
        default: ''
    },
    pickupLatitude: {
        type: Number,
        require: true
    },
    pickupLongitude: {
        type: Number,
        require: true
    },
    pickupAddress: {
        type: String
    },
    deliveredLatitude: {
        type: Number,
    },
    deliveredLongitude: {
        type: Number,
    },
    deliveredAddress: {
        type: String
    },
    details: {
        type: String
    },
    price: {
        type: Number,
        default : 0
    },
    distance: {
        type: Number,
        default: 0
    },
    duration: {
        type: String,
        default: ''
    },
    verifiedPickup: {
        type: Boolean,
        default: false
    },
    verifiedDelivered: {
        type: Boolean,
        default: false
    },
    payed: {
        type: Boolean,
        default: false
    },
    phoneClient: {
        type: String,
    },
    nbresPassager: {
        type: Number
    },
    phoneDriver: {
        type: String,
    },
    payedDriverConfirmation: {
        type: Boolean,
        default: false
    },
    driverDeliveredLatitude: {
        type: Number,
    },
    driverDeliveredLongitude: {
        type: Number,
    },
    ratingBoolean: {
        type: Boolean,
        default: false
    },
    profileDriver: {
        type: String,
        default: ''
    },
    nameDriver: {
        type: String,
        default: ''
    },
    ratingDriver: {
        type: Number,
        default: 0
    },
    shippingCompletedDriver: {
        type: Number,
        default: 0
    },
    driverMissionMap:[
       {
        driverId: {
            type: String,
            default: '',
        },
        name: {
            type: String,
            required: true,
        },
        profile: {
            type: String,
            default: ''
        },
        price: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0
        },
        shippingCompleted: {
            type: Number,
            default: 0
        },
        latitude: {
            type: Number,
        },
        longitude: {
            type: Number,
        },
    }
    ]
}, { timestamps: true })

export const Mission = mongoose.model("Mission", missionSchema);
export default Mission;
