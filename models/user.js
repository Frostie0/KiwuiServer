import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'name is required']
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: [true, 'email is already taken']
    },
    number: {
        type: String,
    },
    password: {
        type: String,
        required: [true, 'password is required'],
        minLength: [6, 'password length should be greather than 6 character']
    },
    country: {
        type: String,
        required: true,
    },
    departement: {
        type: String,
        required: true,
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
        default: false
    },
    tokenBuyer: {
        type: String
    },
    preferences: [
        String,
    ],
    sellerFollowing: [
        String,
    ]
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
export default User;