import { faker } from "@faker-js/faker";
import { HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

export enum BookingApi {
	List = "/bookings",
	Details = "/bookings/:id",
	Cancel = "/bookings/:id/cancel",
	Refund = "/bookings/:id/refund",
	Disputes = "/bookings/disputes",
	ResolveDispute = "/bookings/:id/resolve-dispute",
}

const carWashServices = [
	{ name: "Basic Wash", price: 12 },
	{ name: "Premium Wash", price: 20 },
	{ name: "Interior Cleaning", price: 25 },
	{ name: "Full Detail", price: 45 },
	{ name: "Express Wash", price: 8 },
	{ name: "Wax & Polish", price: 35 },
] as const;

const bookingStatuses = [
	"booked",
	"in_progress",
	"completed",
	"picked",
	"out_for_delivery",
	"delivered",
	"cancelled",
	"rescheduled",
] as const;
const cyprusCities = ["Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia"];
const vehicleMakes = ["Toyota", "Mercedes-Benz", "BMW", "Volkswagen", "Audi", "Honda", "Nissan"];

const generateBookingNumber = () => {
	const prefix = "BK";
	const date = new Date();
	const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
	const random = faker.string.alphanumeric({ length: 6, casing: "upper" });
	return `${prefix}-${dateStr}-${random}`;
};

const generatePartnerName = () => {
	const prefixes = ["Crystal", "Sparkle", "Diamond", "Premium", "Express", "Pro", "Elite", "Golden"];
	const suffixes = ["Car Wash", "Auto Spa", "Detailing", "Car Care"];
	return `${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(suffixes)}`;
};

const generateStatusTimeline = (status: string, createdAt: Date) => {
	const timeline: Array<{ status: string; timestamp: string; note?: string }> = [
		{ status: "booked", timestamp: createdAt.toISOString(), note: "Customer booked slot" },
	];

	if (status === "booked") return timeline;

	if (status === "cancelled") {
		const cancelledAt = new Date(createdAt.getTime() + faker.number.int({ min: 10, max: 60 }) * 60000);
		timeline.push({
			status: "cancelled",
			timestamp: cancelledAt.toISOString(),
			note: faker.helpers.arrayElement(["Cancelled by customer", "Cancelled by partner", "No-show"]),
		});
		return timeline;
	}

	if (status === "rescheduled") {
		const rescheduledAt = new Date(createdAt.getTime() + faker.number.int({ min: 30, max: 120 }) * 60000);
		timeline.push({ status: "rescheduled", timestamp: rescheduledAt.toISOString(), note: "Booking rescheduled" });
		return timeline;
	}

	const inProgressAt = new Date(createdAt.getTime() + faker.number.int({ min: 30, max: 120 }) * 60000);
	timeline.push({ status: "in_progress", timestamp: inProgressAt.toISOString(), note: "Service started" });

	if (status === "in_progress") return timeline;

	const completedAt = new Date(inProgressAt.getTime() + faker.number.int({ min: 20, max: 90 }) * 60000);
	timeline.push({ status: "completed", timestamp: completedAt.toISOString(), note: "Service completed" });

	if (status === "completed") return timeline;

	// For pick-by-me service type
	if (status === "picked" || status === "out_for_delivery" || status === "delivered") {
		const pickedAt = new Date(completedAt.getTime() + faker.number.int({ min: 5, max: 15 }) * 60000);
		timeline.push({ status: "picked", timestamp: pickedAt.toISOString(), note: "Vehicle picked up" });
		if (status === "picked") return timeline;

		const outForDeliveryAt = new Date(pickedAt.getTime() + faker.number.int({ min: 10, max: 30 }) * 60000);
		timeline.push({ status: "out_for_delivery", timestamp: outForDeliveryAt.toISOString(), note: "Out for delivery" });
		if (status === "out_for_delivery") return timeline;

		const deliveredAt = new Date(outForDeliveryAt.getTime() + faker.number.int({ min: 15, max: 45 }) * 60000);
		timeline.push({ status: "delivered", timestamp: deliveredAt.toISOString(), note: "Vehicle delivered to customer" });
	}

	return timeline;
};

const generateBooking = (forceStatus?: string, isDisputed?: boolean) => {
	const status = forceStatus || faker.helpers.arrayElement(bookingStatuses);
	const service = faker.helpers.arrayElement(carWashServices);
	const createdAt = faker.date.recent({ days: 30 });
	const scheduledDate = faker.date.soon({ days: 7, refDate: createdAt });

	return {
		id: faker.string.uuid(),
		bookingNumber: generateBookingNumber(),
		customer: {
			id: faker.string.uuid(),
			name: faker.person.fullName(),
			email: faker.internet.email(),
			phone: faker.phone.number("+357 9# ### ###"),
			avatar: faker.image.avatarGitHub(),
		},
		partner: {
			id: faker.string.uuid(),
			businessName: generatePartnerName(),
			ownerName: faker.person.fullName(),
			phone: faker.phone.number("+357 9# ### ###"),
			location: `${faker.helpers.arrayElement(cyprusCities)}, Cyprus`,
			address: faker.location.streetAddress(),
			rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
		},
		vehicle: {
			make: faker.helpers.arrayElement(vehicleMakes),
			model: faker.vehicle.model(),
			color: faker.helpers.arrayElement(["Black", "White", "Silver", "Blue", "Red"]),
			plateNumber: `${faker.string.alpha({ length: 3, casing: "upper" })} ${faker.number.int({ min: 100, max: 999 })}`,
			year: faker.number.int({ min: 2015, max: 2024 }),
		},
		service: {
			name: service.name,
			price: service.price,
			duration: faker.number.int({ min: 20, max: 90 }),
		},
		scheduledDate: scheduledDate.toISOString(),
		createdAt: createdAt.toISOString(),
		status,
		statusTimeline: generateStatusTimeline(status, createdAt),
		payment: {
			method: faker.helpers.arrayElement(["card", "cash", "wallet"]),
			amount: service.price,
			platformFee: +(service.price * 0.1).toFixed(2),
			partnerPayout: +(service.price * 0.9).toFixed(2),
			status: status === "completed" ? "paid" : status === "cancelled" ? "refunded" : "pending",
			transactionId: faker.string.alphanumeric(16).toUpperCase(),
		},
		rating:
			status === "completed"
				? faker.helpers.maybe(
						() => ({
							score: faker.number.int({ min: 1, max: 5 }),
							comment: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }),
							createdAt: faker.date.recent({ days: 7 }).toISOString(),
						}),
						{ probability: 0.7 },
					)
				: null,
		isDisputed: isDisputed ?? false,
		dispute: isDisputed
			? {
					id: faker.string.uuid(),
					reason: faker.helpers.arrayElement([
						"Service not as described",
						"Damage to vehicle",
						"Partner was rude",
						"Service not completed properly",
						"Overcharged for service",
						"Long wait time",
					]),
					description: faker.lorem.paragraph(),
					createdAt: faker.date.recent({ days: 7 }).toISOString(),
					status: "pending",
					customerEvidence: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }).map(() => ({
						type: faker.helpers.arrayElement(["photo", "video"]),
						url: faker.image.url(),
						uploadedAt: faker.date.recent({ days: 5 }).toISOString(),
					})),
					partnerResponse: faker.helpers.maybe(
						() => ({
							response: faker.lorem.paragraph(),
							evidence: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }).map(() => ({
								type: faker.helpers.arrayElement(["photo", "video"]),
								url: faker.image.url(),
								uploadedAt: faker.date.recent({ days: 3 }).toISOString(),
							})),
							respondedAt: faker.date.recent({ days: 3 }).toISOString(),
						}),
						{ probability: 0.6 },
					),
				}
			: null,
		notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
	};
};

// Generate mock data
const allBookings = Array.from({ length: 80 }).map(() => generateBooking());
const disputedBookings = Array.from({ length: 12 }).map(() => generateBooking("completed", true));

// Get all bookings with filtering
export const getBookings = http.get(`/api${BookingApi.List}`, ({ request }) => {
	const url = new URL(request.url);
	const page = Number.parseInt(url.searchParams.get("page") || "1");
	const limit = Number.parseInt(url.searchParams.get("limit") || "10");
	const search = url.searchParams.get("search") || "";
	const status = url.searchParams.get("status");
	const partnerId = url.searchParams.get("partnerId");
	const customerId = url.searchParams.get("customerId");
	const dateFrom = url.searchParams.get("dateFrom");
	const dateTo = url.searchParams.get("dateTo");

	let filtered = [...allBookings];

	if (search) {
		const searchLower = search.toLowerCase();
		filtered = filtered.filter(
			(b) =>
				b.bookingNumber.toLowerCase().includes(searchLower) ||
				b.customer.name.toLowerCase().includes(searchLower) ||
				b.partner.businessName.toLowerCase().includes(searchLower),
		);
	}

	if (status && status !== "all") {
		filtered = filtered.filter((b) => b.status === status);
	}

	if (partnerId) {
		filtered = filtered.filter((b) => b.partner.id === partnerId);
	}

	if (customerId) {
		filtered = filtered.filter((b) => b.customer.id === customerId);
	}

	if (dateFrom) {
		const fromDate = new Date(dateFrom);
		filtered = filtered.filter((b) => new Date(b.scheduledDate) >= fromDate);
	}

	if (dateTo) {
		const toDate = new Date(dateTo);
		filtered = filtered.filter((b) => new Date(b.scheduledDate) <= toDate);
	}

	// Sort by created date descending
	filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	const start = (page - 1) * limit;
	const end = start + limit;

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			items: filtered.slice(start, end),
			total: filtered.length,
			page,
			limit,
			totalPages: Math.ceil(filtered.length / limit),
		},
	});
});

// Get booking details
export const getBookingDetails = http.get(`/api/bookings/:id`, ({ params }) => {
	const { id } = params;
	const booking = [...allBookings, ...disputedBookings].find((b) => b.id === id);

	if (!booking) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Booking not found" }, { status: 404 });
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: booking,
	});
});

// Cancel booking
export const cancelBooking = http.post(`/api/bookings/:id/cancel`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Booking cancelled successfully",
	});
});

// Issue refund
export const issueRefund = http.post(`/api/bookings/:id/refund`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Refund issued successfully",
	});
});

// Get disputed bookings
export const getDisputes = http.get(`/api${BookingApi.Disputes}`, ({ request }) => {
	const url = new URL(request.url);
	const page = Number.parseInt(url.searchParams.get("page") || "1");
	const limit = Number.parseInt(url.searchParams.get("limit") || "10");

	const start = (page - 1) * limit;
	const end = start + limit;

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			items: disputedBookings.slice(start, end),
			total: disputedBookings.length,
			page,
			limit,
			totalPages: Math.ceil(disputedBookings.length / limit),
		},
	});
});

// Resolve dispute
export const resolveDispute = http.post(`/api/bookings/:id/resolve-dispute`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Dispute resolved successfully",
	});
});

export const bookingHandlers = [
	getBookings,
	getDisputes,
	getBookingDetails,
	cancelBooking,
	issueRefund,
	resolveDispute,
];
