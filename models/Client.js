import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
    clientId: {
        type: String,
        required: true,
        unique: true
    },
    profile: {
        type: String,
        default: ''
    },
    name: {
        type: String,
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: [true, 'email is already taken']
    },
    phone: {
        type: String,
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
    country: {
        type: String,
    },
    departement: {
        type: String,
    },
    province: {
        type: String,
    },
    balance: {
        type: Number,
        default: 0
    },
    notificationStatut: {
        type: Boolean,
        default: true
    },
    tokenClient: {
        type: String
    },
}, { timestamps: true });

export const Client = mongoose.model("Client", clientSchema);
export default Client;


// address: [
//     {
//         clientId: {
//             type: String,
//         },
//         type: {
//             type: String,
//         },
//         country: {
//             type: String,
//         },
//         departement: {
//             type: String,
//         },
//         postalCode: {
//             type: String,
//             require: true,
//         },
//         city: {
//             type: String,
//             require: true
//         },
//         details: {
//             type: String
//         },
//         street: {
//             type: String,
//             require: true
//         },
//         streetNumber: {
//             type: String,
//         },
//         district: {
//             type: String,
//             require: true
//         },
//         addressId: {
//             type: String,
//             require: true,
//             unique: true
//         },
//         verified: {
//             type: Boolean,
//             default: false
//         },
//         latitude: {
//             type: Number,
//             require: true
//         },
//         longitude: {
//             type: Number,
//             require: true
//         },
//     }
// ]