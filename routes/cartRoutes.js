import express from 'express';
import { decrementQuantity, deleteCart, getCartsController, increaseQuantity, sendCartController, updateDispoQuantity } from '../controllers/cartController.js';

//route object
const router = express.Router();

router.post('/sendCart',sendCartController)

router.get('/getCarts/:userId',getCartsController)

router.patch('/increaseQuantity',increaseQuantity)

router.patch('/decrementQuantity',decrementQuantity)

router.delete('/deleteCart',deleteCart)

router.post('/updateDispo',updateDispoQuantity)

export default router