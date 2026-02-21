import express from "express";
import { getPartnerCustomers } from "../../controllers/partner/customer.controller.js";

const router = express.Router();

router.get("/", getPartnerCustomers);

export default router;
