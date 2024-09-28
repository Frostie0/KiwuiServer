import express from 'express';
import { addImageToCarou } from '../controllers/adminController.js';

const router = express.Router();

router.post('/postCarou',addImageToCarou);

export default router