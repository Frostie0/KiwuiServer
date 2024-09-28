import express from 'express';
import {  changeAddress, confirmAddress, deleteAddress, getAddress, getAddressController, sendAddressController, setDefault } from '../controllers/addressController.js';


//router object
const router = express.Router();

router.post("/sendAddress", sendAddressController);

router.get("/getAddresses/:userId", getAddressController);

router.get("/getAddress/:addressId", getAddress);

router.patch("/setDefault/:userId", setDefault);

router.patch("/confirmAddress/:addressId",confirmAddress);

router.delete("/deleteAddress/:addressId",deleteAddress);

router.patch("/changeAddress/:addressId",changeAddress)


export default router