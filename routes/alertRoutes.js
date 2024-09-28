import express from 'express';
import { deleteCommentary, getAlert, postAlert, postCommentary, reportAlert, reportCommentary, updateDislike, updateDislikeCommentary, updateLike, updateLikeCommentary } from '../controllers/alertController.js';

//route object
const router = express.Router();

router.post('/postAlert', postAlert);

router.get('/getAlert',getAlert);

router.patch('/likeCommentary',updateLikeCommentary);

router.patch('/dislikeCommentary',updateDislikeCommentary);

router.patch('/like',updateLike);

router.patch('/dislike',updateDislike);

router.post('/postCommentary',postCommentary);

router.delete('/deleteCommentary',deleteCommentary);

router.post('/reportAlert',reportAlert);

router.post('/reportCommentary', reportCommentary);

export default router