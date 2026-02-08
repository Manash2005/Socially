import express from 'express';
import { createPost, getFeed, getUserPosts, deletePost } from '../controllers/post.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

import { uploadPostImage } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, uploadPostImage.single('image'), createPost);
router.get('/feed', authMiddleware, getFeed);
router.get('/user/:userId', authMiddleware, getUserPosts);
router.delete('/:id', authMiddleware, deletePost);

export default router;
