import express from 'express';
import { addComment, getComments, updateComment, deleteComment } from '../controllers/comment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/:postId', authMiddleware, addComment);
router.get('/:postId', authMiddleware, getComments);
router.put('/:commentId', authMiddleware, updateComment);
router.delete('/:commentId', authMiddleware, deleteComment);

export default router;
