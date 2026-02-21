import { faker } from "@faker-js/faker";
import { HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

export enum PartnerApi {
	List = "/partners",
	Pending = "/partners/pending",
	Active = "/partners/active",
	Suspended = "/partners/suspended",
	Details = "/partners/:id",
	Approve = "/partners/:id/approve",
	Reject = "/partners/:id/reject",
	Suspend = "/partners/:id/suspend",
	Reactivate = "/partners/:id/reactivate",
	Remove = "/partners/:id/remove",
}

// Car wash service types with pricing
const carWashServices = [
	{ name: "Basic Wash", price: 12 },
	{ name: "Premium Wash", price: 20 },
	{ name: "Interior Cleaning", price: 25 },
	{ name: "Full Detail", price: 45 },
	{ name: "Express Wash", price: 8 },
	{ name: "Wax & Polish", price: 35 },
] as const;

// Car wash business name prefixes/suffixes
const businessPrefixes = [
	"Crystal",
	"Sparkle",
	"Diamond",
	"Premium",
	"Express",
	"Pro",
	"Elite",
	"Golden",
	"Quick",
	"Super",
];
const businessSuffixes = [
	"Car Wash",
	"Auto Spa",
	"Detailing",
	"Car Care",
	"Auto Clean",
	"Wash & Go",
];

const generateBusinessName = () => {
	const prefix = faker.helpers.arrayElement(businessPrefixes);
	const suffix = faker.helpers.arrayElement(businessSuffixes);
	return `${prefix} ${suffix}`;
};

const cyprusCities = [
	"Nicosia",
	"Limassol",
	"Larnaca",
	"Paphos",
	"Famagusta",
	"Kyrenia",
	"Paralimni",
	"Ayia Napa",
];

const generatePartner = (status: "pending" | "active" | "suspended") => {
	const services = faker.helpers.arrayElements(carWashServices, {
		min: 2,
		max: 5,
	});
	return {
		id: faker.string.uuid(),
		ownerName: faker.person.fullName(),
		businessName: generateBusinessName(),
		email: faker.internet.email(),
		phone: faker.phone.number("+357 9# ### ###"),
		location: `${faker.helpers.arrayElement(cyprusCities)}, Cyprus`,
		address: faker.location.streetAddress(),
		status,
		services: services.map((s) => ({ name: s.name, price: s.price })),
		rating:
			status === "pending"
				? null
				: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
		totalBookings:
			status === "pending" ? 0 : faker.number.int({ min: 50, max: 2000 }),
		completionRate:
			status === "pending" ? null : faker.number.int({ min: 85, max: 100 }),
		totalEarnings:
			status === "pending"
				? 0
				: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
		isVerified: status === "active" ? faker.datatype.boolean() : false,
		businessLicense: faker.string.alphanumeric(10).toUpperCase(),
		createdAt: faker.date.past({ years: 2 }).toISOString(),
		appliedAt: faker.date.recent({ days: 30 }).toISOString(),
		suspendedAt:
			status === "suspended"
				? faker.date.recent({ days: 14 }).toISOString()
				: null,
		suspensionReason:
			status === "suspended"
				? faker.helpers.arrayElement([
						"Multiple customer complaints",
						"Violation of service standards",
						"Fraudulent activity reported",
						"License verification failed",
						"Repeated cancellations",
					])
				: null,
		schedule: [
			{
				dayOfWeek: 0,
				dayName: "Sunday",
				isEnabled: false,
				timeBlocks: [{ start: "10:00", end: "14:00" }],
			},
			{
				dayOfWeek: 1,
				dayName: "Monday",
				isEnabled: true,
				timeBlocks: [{ start: "08:00", end: "18:00" }],
			},
			{
				dayOfWeek: 2,
				dayName: "Tuesday",
				isEnabled: true,
				timeBlocks: [{ start: "08:00", end: "18:00" }],
			},
			{
				dayOfWeek: 3,
				dayName: "Wednesday",
				isEnabled: true,
				timeBlocks: [{ start: "08:00", end: "18:00" }],
			},
			{
				dayOfWeek: 4,
				dayName: "Thursday",
				isEnabled: true,
				timeBlocks: [{ start: "08:00", end: "18:00" }],
			},
			{
				dayOfWeek: 5,
				dayName: "Friday",
				isEnabled: true,
				timeBlocks: [{ start: "08:00", end: "18:00" }],
			},
			{
				dayOfWeek: 6,
				dayName: "Saturday",
				isEnabled: true,
				timeBlocks: [{ start: "09:00", end: "16:00" }],
			},
		],
		photos: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }).map(
			() => faker.image.urlLoremFlickr({ category: "car" }),
		),
		documents: [
			{
				name: "Business License",
				url: "#",
				verified: faker.datatype.boolean(),
			},
			{
				name: "Insurance Certificate",
				url: "#",
				verified: faker.datatype.boolean(),
			},
		],
	};
};

// Generate mock data
const pendingPartners = Array.from({ length: 12 }).map(() =>
	generatePartner("pending"),
);
const activePartners = Array.from({ length: 25 }).map(() =>
	generatePartner("active"),
);
const suspendedPartners = Array.from({ length: 8 }).map(() =>
	generatePartner("suspended"),
);
const allPartners = [
	...pendingPartners,
	...activePartners,
	...suspendedPartners,
];

// Get pending applications
export const getPendingPartners = http.get(
	`/api${PartnerApi.Pending}`,
	({ request }) => {
		const url = new URL(request.url);
		const page = Number.parseInt(url.searchParams.get("page") || "1");
		const limit = Number.parseInt(url.searchParams.get("limit") || "10");
		const start = (page - 1) * limit;
		const end = start + limit;

		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			data: {
				items: pendingPartners.slice(start, end),
				total: pendingPartners.length,
				page,
				limit,
				totalPages: Math.ceil(pendingPartners.length / limit),
			},
		});
	},
);

// Get active partners
export const getActivePartners = http.get(
	`/api${PartnerApi.Active}`,
	({ request }) => {
		const url = new URL(request.url);
		const page = Number.parseInt(url.searchParams.get("page") || "1");
		const limit = Number.parseInt(url.searchParams.get("limit") || "10");
		const search = url.searchParams.get("search") || "";
		const rating = url.searchParams.get("rating");
		const location = url.searchParams.get("location");
		const verified = url.searchParams.get("verified");

		let filtered = [...activePartners];

		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(p) =>
					p.businessName.toLowerCase().includes(searchLower) ||
					p.ownerName.toLowerCase().includes(searchLower),
			);
		}

		if (rating) {
			const minRating = Number.parseFloat(rating);
			filtered = filtered.filter((p) => p.rating && p.rating >= minRating);
		}

		if (location) {
			filtered = filtered.filter((p) =>
				p.location.toLowerCase().includes(location.toLowerCase()),
			);
		}

		if (verified === "true") {
			filtered = filtered.filter((p) => p.isVerified);
		} else if (verified === "false") {
			filtered = filtered.filter((p) => !p.isVerified);
		}

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
	},
);

// Get suspended partners
export const getSuspendedPartners = http.get(
	`/api${PartnerApi.Suspended}`,
	({ request }) => {
		const url = new URL(request.url);
		const page = Number.parseInt(url.searchParams.get("page") || "1");
		const limit = Number.parseInt(url.searchParams.get("limit") || "10");
		const start = (page - 1) * limit;
		const end = start + limit;

		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			data: {
				items: suspendedPartners.slice(start, end),
				total: suspendedPartners.length,
				page,
				limit,
				totalPages: Math.ceil(suspendedPartners.length / limit),
			},
		});
	},
);

// Get partner details
export const getPartnerDetails = http.get(`/api/partners/:id`, ({ params }) => {
	const { id } = params;
	const partner = allPartners.find((p) => p.id === id);

	if (!partner) {
		return HttpResponse.json(
			{ status: ResultStatus.ERROR, message: "Partner not found" },
			{ status: 404 },
		);
	}

	// Add additional details for the partner details page
	const reviews = Array.from({
		length: faker.number.int({ min: 5, max: 15 }),
	}).map(() => ({
		id: faker.string.uuid(),
		customerName: faker.person.fullName(),
		rating: faker.number.int({ min: 1, max: 5 }),
		comment: faker.lorem.sentence(),
		createdAt: faker.date.recent({ days: 60 }).toISOString(),
	}));

	const earningsHistory = Array.from({ length: 6 })
		.map((_, i) => {
			const date = new Date();
			date.setMonth(date.getMonth() - i);
			return {
				month: date.toLocaleString("default", {
					month: "short",
					year: "numeric",
				}),
				earnings: faker.number.float({
					min: 2000,
					max: 8000,
					fractionDigits: 2,
				}),
				bookings: faker.number.int({ min: 100, max: 400 }),
			};
		})
		.reverse();

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			...partner,
			reviews,
			earningsHistory,
			carWashBays: faker.number.int({ min: 2, max: 6 }),
			detailingBays: faker.number.int({ min: 1, max: 4 }),
		},
	});
});

// Approve partner
export const approvePartner = http.post(`/api/partners/:id/approve`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Partner approved successfully",
	});
});

// Reject partner
export const rejectPartner = http.post(`/api/partners/:id/reject`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Partner rejected successfully",
	});
});

// Suspend partner
export const suspendPartner = http.post(`/api/partners/:id/suspend`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Partner suspended successfully",
	});
});

// Reactivate partner
export const reactivatePartner = http.post(
	`/api/partners/:id/reactivate`,
	() => {
		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			message: "Partner reactivated successfully",
		});
	},
);

// Remove partner
export const removePartner = http.delete(`/api/partners/:id`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Partner removed successfully",
	});
});

export const partnerHandlers = [
	getPendingPartners,
	getActivePartners,
	getSuspendedPartners,
	getPartnerDetails,
	approvePartner,
	rejectPartner,
	suspendPartner,
	reactivatePartner,
	removePartner,
];
