import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
    driverId: {
        type: String,
        require: true,
        unique: true
    },
    name: {
        type: String,
    },
    phone: {
        type: String,
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: [true, 'email is already taken']
    },
    password: {
        type: String,
        required: [true, 'password is required'],
        minLength: [6, 'password length should be greather than 6 character']
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    balance: {
        type: Number,
        default: 0
    },
    notificationStatut: {
        type: Boolean,
        default: true
    },
    tokenDriver: {
        type: String
    },
    profile: {
        type: String,
        default: ''
    },
    licence:{
        type: String,
        default: ''
    },
    matricule:{
        type: String,
        default: ''
    },
    caseJustice:{
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        default: 0
    },
    completedProfile: {
        type: Boolean,
        default: false
    },
    completedDocument: {
        type: Boolean,
        default: false
    },
    ShippingCompleted: {
        type: Number,
        default: 0
    },
    shippingZone: [

    ],
    vehicule: {
        type: String,
    },
    type: {
        type: String,
    },
    type2: {
        type: String
    },
    connected: {
        type: Boolean,
        default: false
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    shippingOrderTask: [
        String
    ],
    sellerBoss: [
        String
    ]
})

export const Driver = mongoose.model("Driver", driverSchema);

export default Driver
