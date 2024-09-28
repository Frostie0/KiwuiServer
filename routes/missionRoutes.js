import express from 'express';
import { completeMissionController, confirmMissionDeliveredAddress, confirmMissionPickupAddress, getCoordinateMissionClientController, getCoordinateMissionController, getMissionsController, getPageController, moncashClientPaymentController, takeMissionController, updateAddressMissionController } from '../controllers/missionController.js';


const router = express.Router();

router.get("/getMissions/:driverId", getMissionsController)

router.post("/takeMission", takeMissionController)

router.post("/completeMission", completeMissionController)

router.get("/getCoordinateMission/:driverId", getCoordinateMissionController)

router.get("/getCoordinateMissionClient/:orderId", getCoordinateMissionClientController)

router.get("/getPage/:orderId", getPageController)

router.patch("/confirmMissionDeliveredAddress/:orderId",confirmMissionDeliveredAddress);

router.patch("/confirmMissionPickupAddress/:orderId",confirmMissionPickupAddress);

router.patch("/updateAddressMission/:orderId",updateAddressMissionController);

router.post('/paymentClient',moncashClientPaymentController)


export default router
