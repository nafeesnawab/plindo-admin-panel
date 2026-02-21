import express from "express";
import {
	createService,
	deleteService,
	duplicateService,
	getServiceById,
	getServices,
	toggleService,
	updateService,
} from "../../controllers/partner/service.controller.js";

const router = express.Router();

router.get("/", getServices);
router.post("/", createService);
router.get("/:id", getServiceById);
router.put("/:id", updateService);
router.delete("/:id", deleteService);
router.patch("/:id/toggle", toggleService);
router.patch("/:id/status", toggleService);
router.post("/:id/duplicate", duplicateService);

export default router;
