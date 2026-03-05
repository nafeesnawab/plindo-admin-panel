import cron from "node-cron";
import Booking from "../models/Booking.model.js";

/**
 * Every minute: auto-cancel pending bookings where acceptDeadline has passed.
 * Runs when server starts via startBookingTimeoutJob().
 */
export function startBookingTimeoutJob() {
	cron.schedule("* * * * *", async () => {
		try {
			const now = new Date();
			const expired = await Booking.find({
				status: "booked",
				acceptDeadline: { $lt: now },
			}).select("_id bookingNumber");

			if (expired.length === 0) return;

			const ids = expired.map((b) => b._id);
			await Booking.updateMany(
				{ _id: { $in: ids } },
				{
					status: "cancelled",
					cancelledAt: now,
					cancelledBy: "partner",
					cancellationReason: "Partner did not accept within 2 minutes",
				},
			);

			console.log(`[BookingTimeout] Auto-cancelled ${expired.length} booking(s): ${expired.map((b) => b.bookingNumber).join(", ")}`);
		} catch (err) {
			console.error("[BookingTimeout] Error:", err.message);
		}
	});

	console.log("[BookingTimeout] Cron job started (every minute)");
}
