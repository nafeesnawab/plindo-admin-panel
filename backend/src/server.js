import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import morgan from "morgan";
import path from "path";
import { Server as SocketServer } from "socket.io";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";
import adminBookingsRoutes from "./routes/adminBookings.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import carRoutes from "./routes/car.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import legalRoutes from "./routes/legal.routes.js";
import logRoutes from "./routes/log.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import mobileRoutes from "./routes/mobile.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import partnerPortalRoutes from "./routes/partner/index.js";
import partnerRoutes from "./routes/partner.routes.js";
import partnerAuthRoutes from "./routes/partnerAuth.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import slotBookingRoutes from "./routes/slotBooking.routes.js";
import subscriptionsRoutes from "./routes/subscriptions.routes.js";
import supportRoutes from "./routes/support.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import userRoutes from "./routes/user.routes.js";
import { initSocket } from "./socket/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
	cors: {
		origin: process.env.CLIENT_URL || "http://localhost:3001",
		methods: ["GET", "POST"],
		credentials: true,
	},
});
initSocket(io);
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = (
	process.env.CLIENT_URL || "http://localhost:3001"
).split(",");
app.use(
	cors({
		origin: (origin, cb) =>
			cb(
				null,
				!origin || allowedOrigins.some((o) => origin.startsWith(o.trim())),
			),
		credentials: true,
	}),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files statically
app.use(
	"/uploads",
	express.static(
		path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads"),
	),
);

// Health check
app.get("/api/health", (req, res) => {
	res.status(200).json({
		status: 0,
		message: "Plindo API is running",
		data: { timestamp: new Date().toISOString() },
	});
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/customers", customerRoutes);
// Slot-booking routes (slots, calculate-price, status, steps) — registered BEFORE generic booking routes
app.use("/api/bookings", slotBookingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/legal", legalRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin/cars", carRoutes);
// Admin bookings endpoint (from slotBookingService.ts AdminBookings)
app.use("/api/admin/bookings", adminBookingsRoutes);
// Public services & subscriptions
app.use("/api/services", servicesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
// Partner public auth routes (register, login, check-email, application-status)
app.use("/api/partner", partnerAuthRoutes);
// Partner portal protected routes (services, earnings, bookings, etc.)
app.use("/api/partner", partnerPortalRoutes);

// Mobile app routes (customer-facing)
app.use("/api/mobile", mobileRoutes);

// Error handler
app.use(errorHandler);

httpServer.listen(PORT, () => {
	console.log(`🚀 Server is running on port ${PORT}`);
	console.log(`📍 Environment: ${process.env.NODE_ENV}`);
	console.log(
		`📂 Uploads: ${path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads")}`,
	);
});
