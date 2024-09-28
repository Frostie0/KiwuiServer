import mongoose from "mongoose";


const PromoSchema = new mongoose.Schema({
    codePromo: {
        type: String,
        unique: true,
        require: true
    },
    use: {
        type: Number
    },
    maxUse: {
        type: Number
    },
    userCodeUse: [
        String
    ],
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    discount: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    productApplicable: {
        type: String
    }
})


export const Promo = mongoose.model("Promo", PromoSchema);

export default Promo;