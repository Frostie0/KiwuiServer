import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true
    },
    type: {
        type: String,
    },
    otp: String,
}, { timestamps: true })

export const OTP = mongoose.model("OTP", OTPSchema);

export default OTP;