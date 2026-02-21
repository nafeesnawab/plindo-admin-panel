import express from "express";
import {
	approvePartner,
	getActivePartners,
	getPartnerDetails,
	getPendingPartners,
	getSuspendedPartners,
	reactivatePartner,
	rejectPartner,
	removePartner,
	suspendPartner,
} from "../controllers/partner.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/pending", getPendingPartners);
router.get("/active", getActivePartners);
router.get("/suspended", getSuspendedPartners);
router.get("/:id", getPartnerDetails);
router.post("/:id/approve", approvePartner);
router.post("/:id/reject", rejectPartner);
router.post("/:id/suspend", suspendPartner);
router.post("/:id/reactivate", reactivatePartner);
router.delete("/:id", removePartner);

export default router;
