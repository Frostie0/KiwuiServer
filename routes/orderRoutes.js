import express from 'express';
import { confirmShippingByDriverController, confirmShippingController, getOrder, getOrderSeller, getTransaction, moncashPaymentController, moncashRetreatController, moncashTransactionController, sendOrder} from '../controllers/orderController.js';


//route object
const router = express.Router();


//route payment
router.post('/payment',moncashPaymentController);

//route retreat
router.post('/retreat',moncashRetreatController);

//route transactionPayment
router.post('/transaction/:orderId',moncashTransactionController);

//get transaction
router.get('/allTransaction/:id' , getTransaction);

//send order
router.post("/sendOrder", sendOrder);

//get Order
router.get("/getOrder/:userId",getOrder)

//get OrderSeller
router.get("/getOrderSeller/:sellerId",getOrderSeller)

//router confirmShipping
router.post('/confirmShipping',confirmShippingController)

router.post('/confirmShippingByDriver',confirmShippingByDriverController)


export default router
