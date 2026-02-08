import express from 'express';
import { register, login, getMe, updateMe } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

import { uploadAvatar } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, uploadAvatar.single('avatar'), updateMe);


export default router;
