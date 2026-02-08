import express from 'express';
import { checkHealth } from '../controllers/health.controller.js';

const router = express.Router();

router.get('/health', checkHealth);

export default router;
