import mongoose from "mongoose";


const LocationSchema = new mongoose.Schema({
    id: {
        type: String,
        require: true,
    },
    latitude: {
        type: Number,
        require: true
    },
    longitude: {
        type: Number,
        require: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})

export const Location = mongoose.model("Location", LocationSchema);

export default Location