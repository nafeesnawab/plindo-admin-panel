import express from 'express';
import { uploadFile, uploadMultipleFiles } from '../controllers/upload.controller.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, uploadSingle, uploadFile);
router.post('/multiple', protect, uploadMultiple, uploadMultipleFiles);

export default router;
