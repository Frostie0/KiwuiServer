import express from "express";
import {
    getProductController, productReviewController,
    productDispoController,
    getWishList, searchProductController, getSubSubCategory, getSubCategory,
    getSellerProduct, postProductController, getProductInfoController, searchProductSellerController,
    postAdsProductController, updateProductViewsController, getUserViewedProductsController, getProductFilteredController,
    getNonCommentary,
    getYesCommentary,
    deleteCommentary,
    updateCommentary,
    getProductCountsController,
    uploadProductImageController,
    deleteProductController,
    updateProductController
} from "../controllers/productController.js"
import multer from 'multer';


const upload = multer({ storage: multer.memoryStorage() });

//router object
const router = express.Router();

router.post('/uploadImage', upload.single('image'), uploadProductImageController);

router.post('/postProduct', postProductController);

router.post('/updateProduct', updateProductController);

router.delete('/deleteProduct/:productId', deleteProductController);

router.get('/getProductInfo/:productId', getProductInfoController);

router.post('/getProductFiltered', getProductFilteredController);

router.get('/getProduct/:userId', getProductController);



// router.post('/postLike',postWishlistController);

// router.post('/getLike',getWishlistController);

// router.patch('/updateLike',updateWishlistController);

router.patch('updateDispoQuantity', productDispoController);

router.post('/getWishlist', getWishList);

router.post('/searchProduct', searchProductController);

router.post('/getSubSubCategory', getSubSubCategory);

router.post('/getSubCategory', getSubCategory);

router.post('/getSellerProduct/:sellerId', getSellerProduct);

router.post('/searchProductSeller/:sellerId', searchProductSellerController);

router.post('/postAdsProduct', postAdsProductController);

router.patch('/updateProductViews/:productId', updateProductViewsController);

router.get('/getUserViewedProduct/:userId', getUserViewedProductsController);

router.get('/getNonCommentary/:userId', getNonCommentary);

router.post('/postReview', productReviewController);

router.get('/getYesCommentary/:userId', getYesCommentary);

router.post('/deleteCommentary', deleteCommentary);

router.patch('/updateCommentary', updateCommentary);

router.get('/productCounts', getProductCountsController);


export default router