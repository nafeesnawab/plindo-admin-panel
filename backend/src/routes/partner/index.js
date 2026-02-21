import express from "express";
import { getCars } from "../../controllers/car.controller.js";
import { authorize, protect } from "../../middleware/auth.middleware.js";
import calendarEventRoutes from "./calendarEvent.routes.js";
import customerRoutes from "./customer.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import driverRoutes from "./driver.routes.js";
import earningRoutes from "./earning.routes.js";
import messageRoutes from "./message.routes.js";
import productRoutes from "./product.routes.js";
import productOrderRoutes from "./productOrder.routes.js";
import reviewRoutes from "./review.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import serviceRoutes from "./service.routes.js";
import settingsRoutes from "./settings.routes.js";

const router = express.Router();

router.use(protect, authorize("partner"));

router.use("/dashboard", dashboardRoutes);
router.use("/customers", customerRoutes);
// Cars read-only access for partner (used in service pricing)
router.get("/cars", getCars);
// Schedule routes (availability, capacity, bookings) — registered at root level
// so /api/partner/availability/*, /api/partner/capacity, /api/partner/bookings work
router.use("/", scheduleRoutes);
router.use("/services", serviceRoutes);
router.use("/earnings", earningRoutes);
router.use("/reviews", reviewRoutes);
router.use("/messages", messageRoutes);
router.use("/drivers", driverRoutes);
router.use("/products", productRoutes);
router.use("/product-orders", productOrderRoutes);
router.use("/settings", settingsRoutes);
router.use("/", calendarEventRoutes);

export default router;
