import express from "express";
import PDFDocument from "pdfkit";
import Booking from "../../models/Booking.model.js";
import { error } from "../../utils/response.js";

const router = express.Router();

// GET /api/partner/invoices — list monthly summaries
router.get("/", async (req, res) => {
	try {
		const partnerId = req.user.id;

		const bookings = await Booking.find({
			partnerId,
			status: "completed",
		})
			.select("slotDate pricing serviceName createdAt")
			.lean();

		const monthMap = {};
		for (const b of bookings) {
			const d = new Date(b.slotDate || b.createdAt);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			if (!monthMap[key]) {
				monthMap[key] = { month: key, totalBookings: 0, grossRevenue: 0, commissionPaid: 0, netAmount: 0 };
			}
			const gross = b.pricing?.finalPrice || 0;
			const commission = b.pricing?.platformFee || 0;
			monthMap[key].totalBookings += 1;
			monthMap[key].grossRevenue += gross;
			monthMap[key].commissionPaid += commission;
			monthMap[key].netAmount += gross - commission;
		}

		const invoices = Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month));
		res.json({ status: 0, data: invoices });
	} catch (err) {
		return error(res, err.message, 500);
	}
});

// GET /api/partner/invoices/:month/download — stream PDF
router.get("/:month/download", async (req, res) => {
	try {
		const partnerId = req.user.id;
		const { month } = req.params; // e.g. "2025-01"
		const [year, mon] = month.split("-").map(Number);

		const start = new Date(year, mon - 1, 1);
		const end = new Date(year, mon, 0, 23, 59, 59);

		const bookings = await Booking.find({
			partnerId,
			status: "completed",
			slotDate: {
				$gte: start.toISOString().split("T")[0],
				$lte: end.toISOString().split("T")[0],
			},
		})
			.select("bookingNumber slotDate serviceName pricing")
			.lean();

		const { default: Partner } = await import("../../models/Partner.model.js");
		const partner = await Partner.findById(partnerId).select("businessName email").lean();

		const doc = new PDFDocument({ margin: 50 });
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename="invoice-${month}.pdf"`);
		doc.pipe(res);

		doc.fontSize(20).text("PLINDO - Monthly Invoice", { align: "center" });
		doc.moveDown();
		doc.fontSize(12).text(`Partner: ${partner?.businessName || "N/A"}`);
		doc.text(`Email: ${partner?.email || "N/A"}`);
		doc.text(`Period: ${month}`);
		doc.moveDown();

		doc.text("Bookings:", { underline: true });
		doc.moveDown(0.5);

		let gross = 0, commission = 0;
		for (const b of bookings) {
			const amount = b.pricing?.finalPrice || 0;
			const fee = b.pricing?.platformFee || 0;
			gross += amount;
			commission += fee;
			doc.text(`${b.bookingNumber} | ${b.slotDate} | ${b.serviceName} | EUR${amount.toFixed(2)} | Fee: EUR${fee.toFixed(2)}`);
		}

		doc.moveDown();
		doc.text(`Total Bookings: ${bookings.length}`);
		doc.text(`Gross Revenue: EUR${gross.toFixed(2)}`);
		doc.text(`Commission Paid: EUR${commission.toFixed(2)}`);
		doc.text(`Net Payout: EUR${(gross - commission).toFixed(2)}`, { bold: true });

		doc.end();
	} catch (err) {
		return error(res, err.message, 500);
	}
});

export default router;
