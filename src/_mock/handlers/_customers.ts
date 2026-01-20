import { ResultStatus } from "@/types/enum";
import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

export enum CustomerApi {
	List = "/customers",
	Details = "/customers/:id",
	Suspend = "/customers/:id/suspend",
	Reactivate = "/customers/:id/reactivate",
	Delete = "/customers/:id",
	SendNotification = "/customers/:id/notify",
}

// Car wash service types
const carWashServices = [
	"Basic Wash",
	"Premium Wash",
	"Interior Cleaning",
	"Full Detail",
	"Express Wash",
	"Wax & Polish",
] as const;

// Vehicle makes common in Cyprus
const vehicleMakes = ["Toyota", "Mercedes-Benz", "BMW", "Volkswagen", "Audi", "Honda", "Nissan", "Ford", "Mazda", "Hyundai"];
const vehicleColors = ["Black", "White", "Silver", "Blue", "Red", "Grey", "Green"];

const cyprusCities = ["Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia", "Paralimni", "Ayia Napa"];

const subscriptionPlans = [
	{ name: "None", price: 0 },
	{ name: "Basic", price: 15 },
	{ name: "Premium", price: 28 },
] as const;

const generateVehicle = () => ({
	id: faker.string.uuid(),
	make: faker.helpers.arrayElement(vehicleMakes),
	model: faker.vehicle.model(),
	color: faker.helpers.arrayElement(vehicleColors),
	plateNumber: `${faker.string.alpha({ length: 3, casing: "upper" })} ${faker.number.int({ min: 100, max: 999 })}`,
	year: faker.number.int({ min: 2010, max: 2024 }),
});

const generateBooking = () => {
	const status = faker.helpers.arrayElement(["completed", "cancelled", "in_progress", "confirmed", "pending"] as const);
	return {
		id: faker.string.uuid(),
		service: faker.helpers.arrayElement(carWashServices),
		partnerName: `${faker.helpers.arrayElement(["Crystal", "Sparkle", "Diamond", "Premium", "Express"])} Car Wash`,
		amount: faker.number.float({ min: 8, max: 45, fractionDigits: 2 }),
		status,
		date: faker.date.recent({ days: 90 }).toISOString(),
		rating: status === "completed" ? faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), { probability: 0.7 }) : null,
	};
};

const generateCustomer = (status: "active" | "suspended") => {
	const subscription = faker.helpers.arrayElement(subscriptionPlans);
	const hasSubscription = subscription.name !== "None";
	
	return {
		id: faker.string.uuid(),
		name: faker.person.fullName(),
		email: faker.internet.email(),
		phone: faker.phone.number("+357 9# ### ###"),
		avatar: faker.image.avatarGitHub(),
		location: `${faker.helpers.arrayElement(cyprusCities)}, Cyprus`,
		status,
		registeredAt: faker.date.past({ years: 2 }).toISOString(),
		lastActiveAt: faker.date.recent({ days: 30 }).toISOString(),
		totalBookings: faker.number.int({ min: 0, max: 150 }),
		totalSpent: faker.number.float({ min: 0, max: 2000, fractionDigits: 2 }),
		vehicles: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }).map(() => generateVehicle()),
		subscription: {
			plan: subscription.name,
			price: subscription.price,
			active: hasSubscription,
			startDate: hasSubscription ? faker.date.past({ years: 1 }).toISOString() : null,
			renewalDate: hasSubscription ? faker.date.future({ years: 1 }).toISOString() : null,
			washesRemaining: hasSubscription ? faker.number.int({ min: 0, max: 8 }) : 0,
		},
		paymentMethods: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }).map(() => ({
			id: faker.string.uuid(),
			type: faker.helpers.arrayElement(["visa", "mastercard"] as const),
			last4: faker.finance.creditCardNumber("####"),
			expiryMonth: faker.number.int({ min: 1, max: 12 }),
			expiryYear: faker.number.int({ min: 2025, max: 2030 }),
			isDefault: faker.datatype.boolean(),
		})),
		suspendedAt: status === "suspended" ? faker.date.recent({ days: 30 }).toISOString() : null,
		suspensionReason: status === "suspended" ? faker.helpers.arrayElement([
			"Payment fraud detected",
			"Abusive behavior reported",
			"Multiple no-shows",
			"Violation of terms of service",
			"Chargeback dispute",
		]) : null,
	};
};

// Generate mock data
const activeCustomers = Array.from({ length: 45 }).map(() => generateCustomer("active"));
const suspendedCustomers = Array.from({ length: 8 }).map(() => generateCustomer("suspended"));
const allCustomers = [...activeCustomers, ...suspendedCustomers];

// Get all customers with filtering
export const getCustomers = http.get(`/api${CustomerApi.List}`, ({ request }) => {
	const url = new URL(request.url);
	const page = Number.parseInt(url.searchParams.get("page") || "1");
	const limit = Number.parseInt(url.searchParams.get("limit") || "10");
	const search = url.searchParams.get("search") || "";
	const status = url.searchParams.get("status");
	const dateFrom = url.searchParams.get("dateFrom");
	const dateTo = url.searchParams.get("dateTo");

	let filtered = [...allCustomers];

	if (search) {
		const searchLower = search.toLowerCase();
		filtered = filtered.filter(
			(c) =>
				c.name.toLowerCase().includes(searchLower) ||
				c.email.toLowerCase().includes(searchLower) ||
				c.phone.includes(search)
		);
	}

	if (status && status !== "all") {
		filtered = filtered.filter((c) => c.status === status);
	}

	if (dateFrom) {
		const fromDate = new Date(dateFrom);
		filtered = filtered.filter((c) => new Date(c.registeredAt) >= fromDate);
	}

	if (dateTo) {
		const toDate = new Date(dateTo);
		filtered = filtered.filter((c) => new Date(c.registeredAt) <= toDate);
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
});

// Get customer details
export const getCustomerDetails = http.get(`/api/customers/:id`, ({ params }) => {
	const { id } = params;
	const customer = allCustomers.find((c) => c.id === id);

	if (!customer) {
		return HttpResponse.json(
			{ status: ResultStatus.ERROR, message: "Customer not found" },
			{ status: 404 }
		);
	}

	// Generate booking history for details page
	const bookingHistory = Array.from({ length: faker.number.int({ min: 5, max: 20 }) }).map(() =>
		generateBooking()
	).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			...customer,
			bookingHistory,
		},
	});
});

// Suspend customer
export const suspendCustomer = http.post(`/api/customers/:id/suspend`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Customer suspended successfully",
	});
});

// Reactivate customer
export const reactivateCustomer = http.post(`/api/customers/:id/reactivate`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Customer reactivated successfully",
	});
});

// Delete customer
export const deleteCustomer = http.delete(`/api/customers/:id`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Customer deleted successfully",
	});
});

// Send notification to customer
export const sendNotification = http.post(`/api/customers/:id/notify`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Notification sent successfully",
	});
});

export const customerHandlers = [
	getCustomers,
	getCustomerDetails,
	suspendCustomer,
	reactivateCustomer,
	deleteCustomer,
	sendNotification,
];
