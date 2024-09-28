import express from 'express';
import {
    sendPasswordResetOTPController, loginController,
    registerController, updatePasswordController,
    updateProfileController,
    getUserProfileController,
    removeUserPreferenceController,
    registerTokenController,
    sendChangeOrderNotif,
    getFollowingSellerController,
    followingSellerController,
} from '../controllers/userController.js';
// import {isAuth} from "../middlewares/authMiddlewares.js";


//router object
const router = express.Router();

//routes register
router.post('/register', registerController);

//route login
router.post('/login', loginController);

router.post('/registerToken/:userId',registerTokenController)

//route profile
router.get('/profile/:userId', getUserProfileController)

// update profile
router.put('/profileUpdate', updateProfileController);

// update password
router.put('/updatePassword', updatePasswordController);

//forgot password
router.post('/forgetPassword', sendPasswordResetOTPController);

//updatePreferences
router.patch('/removePreference/:userId',removeUserPreferenceController);

router.post('/sendChangeOrderNotif/:userId',sendChangeOrderNotif);

router.get('/getFollowingSeller/:userId',getFollowingSellerController);

router.patch('/followingSeller',followingSellerController);


//export
export default router