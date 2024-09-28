import express from 'express'
import { usePromo } from '../controllers/PromoController.js';


const router = express.Router();



router.post('/useCodePromo/:userId',usePromo);


export default router