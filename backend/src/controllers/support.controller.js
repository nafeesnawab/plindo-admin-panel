import { paginate } from "../utils/pagination.js";
import { error, success } from "../utils/response.js";

const ticketsStore = [];
let ticketCounter = 1000;

const makeTicket = (data) => ({
	id: `ticket-${++ticketCounter}`,
	ticketNumber: `TKT-${ticketCounter}`,
	subject: data.subject || "",
	description: data.description || "",
	status: "open",
	priority: data.priority || "medium",
	userType: data.userType || "customer",
	user: data.user || { id: "", name: "", email: "", avatar: "" },
	assignedTo: null,
	messages: data.messages || [],
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
});

/**
 * GET /api/support/tickets
 */
export const getTickets = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		let filtered = [...ticketsStore];

		if (req.query.status) filtered = filtered.filter((t) => t.status === req.query.status);
		if (req.query.userType) filtered = filtered.filter((t) => t.userType === req.query.userType);

		const total = filtered.length;
		const paginated = filtered.slice(skip, skip + limit);

		return success(res, {
			tickets: paginated,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/support/tickets/:id
 */
export const getTicketDetails = async (req, res) => {
	try {
		const ticket = ticketsStore.find((t) => t.id === req.params.id);
		if (!ticket) return error(res, "Ticket not found", 404);
		return success(res, ticket);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/support/tickets/:id/reply
 */
export const replyToTicket = async (req, res) => {
	try {
		const ticket = ticketsStore.find((t) => t.id === req.params.id);
		if (!ticket) return error(res, "Ticket not found", 404);

		const message = {
			id: `msg-${Date.now()}`,
			senderId: req.user.id,
			senderName: req.user.username || "Admin",
			senderType: "admin",
			message: req.body.message,
			timestamp: new Date().toISOString(),
		};

		ticket.messages.push(message);
		ticket.status = "in_progress";
		ticket.updatedAt = new Date().toISOString();

		return success(res, ticket, "Reply sent");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/support/tickets/:id/assign
 */
export const assignTicket = async (req, res) => {
	try {
		const ticket = ticketsStore.find((t) => t.id === req.params.id);
		if (!ticket) return error(res, "Ticket not found", 404);

		ticket.assignedTo = req.body.adminName || req.user.username || "Admin";
		ticket.status = "in_progress";
		ticket.updatedAt = new Date().toISOString();

		return success(res, ticket, "Ticket assigned");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/support/tickets/:id/close
 */
export const closeTicket = async (req, res) => {
	try {
		const ticket = ticketsStore.find((t) => t.id === req.params.id);
		if (!ticket) return error(res, "Ticket not found", 404);

		ticket.status = "closed";
		ticket.updatedAt = new Date().toISOString();

		return success(res, ticket, "Ticket closed");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

export { makeTicket, ticketsStore };
