import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
