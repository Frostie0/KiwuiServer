import express from 'express';
import { ChangeOTPPassword, resetPassword, sendOTP, verifyOTP, verifyOTPPassword } from '../controllers/OTPController.js';


//router object
const router = express.Router();

//route sendOTP
router.post('/sendOTP',sendOTP)

//route verify OTP
router.post('/verifyOTP',verifyOTP)

//route password reset request
router.post('/resetPassword',resetPassword)

//route verify reset password
router.post('/verifyOTPPassword',verifyOTPPassword)

//route change otp password
router.post('/changeOTPPassword',ChangeOTPPassword)

export default router