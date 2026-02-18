import { faker } from "@faker-js/faker";
import { HttpResponse, http } from "msw";

import { ResultStatus } from "@/types/enum";

enum SupportApi {
	Tickets = "/support/tickets",
	TicketDetails = "/support/tickets/:id",
	TicketReply = "/support/tickets/:id/reply",
	TicketAssign = "/support/tickets/:id/assign",
	TicketClose = "/support/tickets/:id/close",
}

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type UserType = "customer" | "partner";

interface Message {
	id: string;
	senderId: string;
	senderName: string;
	senderType: "user" | "admin";
	message: string;
	timestamp: string;
}

const generateTicket = () => {
	const userType: UserType = faker.helpers.arrayElement(["customer", "partner"]);
	const status: TicketStatus = faker.helpers.arrayElement(["open", "in_progress", "resolved", "closed"]);
	const messageCount = faker.number.int({ min: 1, max: 5 });

	const messages: Message[] = Array.from({ length: messageCount }, (_, i) => ({
		id: faker.string.uuid(),
		senderId: i % 2 === 0 ? faker.string.uuid() : "admin",
		senderName: i % 2 === 0 ? faker.person.fullName() : "Support Team",
		senderType: i % 2 === 0 ? "user" : "admin",
		message: faker.lorem.paragraph(),
		timestamp: faker.date.recent({ days: 7 - i }).toISOString(),
	}));

	return {
		id: faker.string.uuid(),
		ticketNumber: `TKT-${faker.number.int({ min: 10000, max: 99999 })}`,
		subject: faker.helpers.arrayElement([
			"Cannot complete booking",
			"Payment not processed",
			"Partner did not show up",
			"Refund request",
			"Account access issue",
			"App not working properly",
			"Wrong charge on my card",
			"Service quality complaint",
		]),
		description: faker.lorem.paragraphs(2),
		status,
		priority: faker.helpers.arrayElement(["low", "medium", "high", "urgent"]),
		userType,
		user: {
			id: faker.string.uuid(),
			name: faker.person.fullName(),
			email: faker.internet.email(),
			avatar: faker.image.avatar(),
		},
		assignedTo: status !== "open" ? faker.person.fullName() : null,
		messages,
		createdAt: faker.date.recent({ days: 14 }).toISOString(),
		updatedAt: faker.date.recent({ days: 3 }).toISOString(),
	};
};

const tickets = Array.from({ length: 25 }, generateTicket);

const getTickets = http.get(`/api${SupportApi.Tickets}`, ({ request }) => {
	const url = new URL(request.url);
	const status = url.searchParams.get("status");
	const userType = url.searchParams.get("userType");
	const page = Number(url.searchParams.get("page")) || 1;
	const limit = Number(url.searchParams.get("limit")) || 10;

	let filtered = [...tickets];

	if (status && status !== "all") {
		filtered = filtered.filter((t) => t.status === status);
	}
	if (userType && userType !== "all") {
		filtered = filtered.filter((t) => t.userType === userType);
	}

	filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	const total = filtered.length;
	const start = (page - 1) * limit;
	const paginated = filtered.slice(start, start + limit);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			tickets: paginated,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		},
	});
});

const getTicketDetails = http.get(`/api${SupportApi.TicketDetails}`, ({ params }) => {
	const { id } = params;
	const ticket = tickets.find((t) => t.id === id);

	if (!ticket) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Ticket not found" }, { status: 404 });
	}

	return HttpResponse.json({ status: ResultStatus.SUCCESS, data: ticket });
});

const replyToTicket = http.post(`/api${SupportApi.TicketReply}`, async ({ params, request }) => {
	const { id } = params;
	const body = (await request.json()) as { message: string };
	const ticket = tickets.find((t) => t.id === id);

	if (!ticket) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Ticket not found" }, { status: 404 });
	}

	const newMessage: Message = {
		id: faker.string.uuid(),
		senderId: "admin",
		senderName: "Support Team",
		senderType: "admin",
		message: body.message,
		timestamp: new Date().toISOString(),
	};

	ticket.messages.push(newMessage);
	ticket.updatedAt = new Date().toISOString();
	if (ticket.status === "open") {
		ticket.status = "in_progress";
	}

	return HttpResponse.json({ status: ResultStatus.SUCCESS, message: "Reply sent", data: ticket });
});

const assignTicket = http.post(`/api${SupportApi.TicketAssign}`, async ({ params, request }) => {
	const { id } = params;
	const body = (await request.json()) as { adminName: string };
	const ticket = tickets.find((t) => t.id === id);

	if (!ticket) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Ticket not found" }, { status: 404 });
	}

	ticket.assignedTo = body.adminName;
	ticket.status = "in_progress";
	ticket.updatedAt = new Date().toISOString();

	return HttpResponse.json({ status: ResultStatus.SUCCESS, message: "Ticket assigned", data: ticket });
});

const closeTicket = http.post(`/api${SupportApi.TicketClose}`, ({ params }) => {
	const { id } = params;
	const ticket = tickets.find((t) => t.id === id);

	if (!ticket) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Ticket not found" }, { status: 404 });
	}

	ticket.status = "closed";
	ticket.updatedAt = new Date().toISOString();

	return HttpResponse.json({ status: ResultStatus.SUCCESS, message: "Ticket closed", data: ticket });
});

export const supportHandlers = [getTickets, getTicketDetails, replyToTicket, assignTicket, closeTicket];
