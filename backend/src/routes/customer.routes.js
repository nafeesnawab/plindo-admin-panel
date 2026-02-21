import express from "express";
import {
	deleteCustomer,
	getCustomerDetails,
	getCustomers,
	reactivateCustomer,
	sendNotification,
	suspendCustomer,
} from "../controllers/customer.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/", getCustomers);
router.get("/:id", getCustomerDetails);
router.post("/:id/suspend", suspendCustomer);
router.post("/:id/reactivate", reactivateCustomer);
router.delete("/:id", deleteCustomer);
router.post("/:id/notify", sendNotification);

export default router;
