import express from "express";
import { Parser as Json2csvParser } from "json2csv";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import Booking from "../../models/Booking.model.js";
import Customer from "../../models/Customer.model.js";
import Partner from "../../models/Partner.model.js";
import { error } from "../../utils/response.js";

const router = express.Router();
router.use(protect, authorize("admin"));

const dateFilter = (from, to) => {
	const f = {};
	if (from || to) {
		f.createdAt = {};
		if (from) f.createdAt.$gte = new Date(from);
		if (to) f.createdAt.$lte = new Date(to);
	}
	return f;
};

const sendCsv = (res, fields, data, filename) => {
	try {
		const parser = new Json2csvParser({ fields });
		const csv = parser.parse(data);
		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
		res.send(csv);
	} catch (err) {
		error(res, err.message, 500);
	}
};

// GET /api/admin/reports/bookings
router.get("/bookings", async (req, res) => {
	const { from, to } = req.query;
	const bookings = await Booking.find(dateFilter(from, to)).sort({ createdAt: -1 }).lean();
	const data = bookings.map((b) => ({
		bookingNumber: b.bookingNumber,
		customer: b.customerName,
		partner: b.partnerBusinessName,
		service: b.serviceName,
		date: b.slotDate,
		status: b.status,
		amount: b.pricing?.finalPrice || 0,
		platformFee: b.pricing?.platformFee || 0,
		createdAt: b.createdAt?.toISOString().split("T")[0],
	}));
	sendCsv(res, Object.keys(data[0] || {}), data, `bookings-report-${Date.now()}.csv`);
});

// GET /api/admin/reports/finance
router.get("/finance", async (req, res) => {
	const { from, to } = req.query;
	const bookings = await Booking.find({ ...dateFilter(from, to), status: "completed" }).lean();
	const data = bookings.map((b) => ({
		bookingNumber: b.bookingNumber,
		partner: b.partnerBusinessName,
		service: b.serviceName,
		date: b.slotDate,
		grossRevenue: b.pricing?.finalPrice || 0,
		platformFee: b.pricing?.platformFee || 0,
		partnerPayout: b.pricing?.partnerPayout || 0,
		completedAt: b.completedAt?.toISOString().split("T")[0],
	}));
	sendCsv(res, Object.keys(data[0] || {}), data, `finance-report-${Date.now()}.csv`);
});

// GET /api/admin/reports/partners
router.get("/partners", async (req, res) => {
	const partners = await Partner.find({}).lean();
	const data = partners.map((p) => ({
		businessName: p.businessName,
		email: p.email,
		status: p.status,
		rating: p.rating,
		totalBookings: p.totalBookings,
		completionRate: p.completionRate,
		totalEarnings: p.totalEarnings,
		hasWarning: p.hasWarning,
		joinedAt: p.appliedAt?.toISOString().split("T")[0],
	}));
	sendCsv(res, Object.keys(data[0] || {}), data, `partners-report-${Date.now()}.csv`);
});

// GET /api/admin/reports/customers
router.get("/customers", async (req, res) => {
	const customers = await Customer.find({}).lean();
	const data = customers.map((c) => ({
		name: c.name,
		email: c.email,
		phone: c.phone,
		status: c.status,
		totalBookings: c.totalBookings,
		totalSpent: c.totalSpent,
		cancellationCount: c.cancellationCount || 0,
		subscriptionTier: c.subscriptionTier,
		joinedAt: c.createdAt?.toISOString().split("T")[0],
	}));
	sendCsv(res, Object.keys(data[0] || {}), data, `customers-report-${Date.now()}.csv`);
});

export default router;
