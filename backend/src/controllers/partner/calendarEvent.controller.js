import PartnerCalendarEvent from "../../models/PartnerCalendarEvent.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/calendar-events
 */
export const getCalendarEvents = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const filter = { partnerId: req.user.partnerId };
		if (startDate && endDate) {
			filter.start = { $gte: new Date(startDate) };
			filter.end = { $lte: new Date(`${endDate}T23:59:59.999Z`) };
		}
		const events = await PartnerCalendarEvent.find(filter).sort({ start: 1 }).lean();
		return success(res, { events });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/calendar-events
 */
export const createCalendarEvent = async (req, res) => {
	try {
		const { title, description, start, end, color, backgroundColor, type } = req.body;
		if (!title || !start || !end) {
			return error(res, "title, start and end are required", 400);
		}
		const event = await PartnerCalendarEvent.create({
			partnerId: req.user.partnerId,
			title,
			description: description || "",
			start: new Date(start),
			end: new Date(end),
			color: color || "#6b7280",
			backgroundColor: backgroundColor || color || "#6b7280",
			type: type || "event",
		});
		return success(res, { event }, "Event created");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/partner/calendar-events/:id
 */
export const deleteCalendarEvent = async (req, res) => {
	try {
		const event = await PartnerCalendarEvent.findOneAndDelete({
			_id: req.params.id,
			partnerId: req.user.partnerId,
		});
		if (!event) return error(res, "Event not found", 404);
		return success(res, {}, "Event deleted");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
