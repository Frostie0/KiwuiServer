import express from 'express'

import { getSellerMarker, getSellerController, searchSellerController, getSellerId, upgradePlanController,
      buyAdsProductController, buyAdsCarouController, sellAdsProductController, sellAdsCarouController, sendRequestCarouController, getDashboardController, registerSellerController, loginSellerController, updateSellerProfileController, postSellerAddressController, addDriverSellerController, removeDriverSellerController, assignOrderToDriverController, removeOrderFromDriverController, 
      updateSellerAddressController,
      confirmSellerAddressController,
      completeShippingZoneController,
      getDriverTaxi,
      searchDriverTaxiController} from '../controllers/sellerController.js';


//route object
const router = express.Router();

//route seller
router.post('/registerSeller', registerSellerController)

router.post('/loginSeller', loginSellerController)

router.post('/updateSellerProfile', updateSellerProfileController);

router.post('/postSellerAddress', postSellerAddressController);

router.patch('/updateSellerAddress/:sellerId', updateSellerAddressController);

router.patch('/confirmSellerAddress/:sellerId', confirmSellerAddressController);

router.patch('/completeShippingZone/:sellerId', completeShippingZoneController);


router.post('/searchDriverTaxi', searchDriverTaxiController);

router.post('/addDriverToSeller', addDriverSellerController);

router.post('/removeDriverFromSeller', removeDriverSellerController);

router.post('/assignOrderToDriver', assignOrderToDriverController);

router.post('/removeOrderFromDriver', removeOrderFromDriverController);



router.get('/getSeller',getSellerController);

router.get('/getSellerMarker', getSellerMarker);

router.post('/searchSeller',searchSellerController);


router.get('/getSellerId/:sellerId',getSellerId)

router.post('/upgradePlan/:sellerId',upgradePlanController);

router.post('./buyAdsProduct/:sellerId',buyAdsProductController)

router.post('./buyAdsCarou/:sellerId',buyAdsCarouController)

router.post('./sellAdsProduct/:sellerId',sellAdsProductController)

router.post('./sellAdsCarou/:sellerId',sellAdsCarouController)

router.post('/sendRequestCarou',sendRequestCarouController)

router.post('/getDashboard/:sellerId',getDashboardController);

export default router