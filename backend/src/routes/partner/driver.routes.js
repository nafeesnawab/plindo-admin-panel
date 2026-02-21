import express from "express";
import {
	createDriver,
	deleteDriver,
	getActiveDrivers,
	getDriver,
	getDrivers,
	getExpiringDrivers,
	updateDriver,
} from "../../controllers/partner/driver.controller.js";

const router = express.Router();

router.get("/active", getActiveDrivers);
router.get("/expiring", getExpiringDrivers);
router.get("/", getDrivers);
router.post("/", createDriver);
router.get("/:id", getDriver);
router.put("/:id", updateDriver);
router.delete("/:id", deleteDriver);

export default router;
