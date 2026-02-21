import express from "express";
import {
	createCar,
	deleteCar,
	getBodyTypes,
	getCarById,
	getCars,
	getGrouped,
	getMakes,
	getModelsByMake,
	updateCar,
} from "../controllers/car.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/makes", getMakes);
router.get("/body-types", getBodyTypes);
router.get("/grouped", getGrouped);
router.get("/models/:make", getModelsByMake);
router.get("/", getCars);
router.post("/", createCar);
router.get("/:id", getCarById);
router.put("/:id", updateCar);
router.delete("/:id", deleteCar);

export default router;
