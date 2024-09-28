import express from 'express';
import { getMessageController, getTchatController } from '../controllers/messageController.js';

const router = express.Router();

router.get('/getMessage', getMessageController);

router.get('/getTchat', getTchatController);

export default router;