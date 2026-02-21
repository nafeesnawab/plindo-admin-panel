import express from "express";
import { getMenu } from "../controllers/menu.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getMenu);

export default router;
