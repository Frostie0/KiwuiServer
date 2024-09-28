import express from 'express';
import { checkEmailDriverController, completeProfileController, completeTransportController, getActivityController, getDriver, getDriverSellerBossInfoController, getDriverTasksInfoController, getProfileDriver, loginDriverController, registerDriverController, registerTokenController, searchDriverController, updateDocumentController, updateProfileController, uploadDriverImageController } from '../controllers/DriverController.js';
import multer from 'multer';


const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/uploadImage', upload.single('image'), uploadDriverImageController);

router.get('/getProfileDriver/:driverId', getProfileDriver);

router.patch('/updateProfile/:driverId', updateProfileController);


router.post('/checkEmailDriver', checkEmailDriverController);

router.post('/registerDriver', registerDriverController)

router.post('/loginDriver', loginDriverController)

router.post('/completeProfile/:driverId', completeProfileController);

router.patch('/completeTransport/:driverId', completeTransportController);


router.post('/updateDocument/:driverId', updateDocumentController);

router.get('/getDriver/:driverId', getDriver);

router.get('/getDriverTasksInfo/:driverId', getDriverTasksInfoController);



router.get('/getDriverSellerBossInfo/:driverId', getDriverSellerBossInfoController);

router.post('/searchDriver', searchDriverController);

router.post('/registerToken/:driverId',registerTokenController);

router.get('/getActivity/:driverId', getActivityController);

export default router