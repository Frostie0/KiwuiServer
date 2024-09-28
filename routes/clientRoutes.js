import express from 'express';
import { cancelActivityController, checkEmailController, getActivityController, getClientController, loginClientController, ratingDriverController, registerClientController, registerTokenController, searchClientDriverTaxiController, updateProfileController, uploadClientImageController } from '../controllers/clientController.js';
import multer from 'multer';


const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();


router.post('/uploadImage', upload.single('image'), uploadClientImageController);

router.patch('/updateProfile/:clientId', updateProfileController);



router.post('/checkEmail', checkEmailController);

router.post('/registerClient', registerClientController);

router.post('/loginClient', loginClientController);

router.post('/registerToken/:clientId', registerTokenController);

router.post('/searchClientDriverTaxi', searchClientDriverTaxiController);

router.get('/getClient/:clientId', getClientController);

router.get('/getActivity/:clientId', getActivityController);

router.post('/cancelActivity/:clientId', cancelActivityController);

router.post('/ratingDriver/:clientId', ratingDriverController);

export default router