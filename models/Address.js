import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    userId: {
        type: String,
        require: true
    },
    mobileNo: {
        type: String,
        require: true
    },
    city: {
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
    type: {
        type: String,
        require: true
    },
    default: {
        type: Boolean,
        default: false
    },
    addressId: {
        type: String,
        require: true,
        unique: true
    },
    postalCode:{
        type: String,
        require: true,
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number,
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Address = mongoose.model("Address", addressSchema);

export default Address