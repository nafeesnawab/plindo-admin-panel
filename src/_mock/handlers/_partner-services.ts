import { faker } from "@faker-js/faker";
import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

// Types
interface BodyTypePricing {
	bodyType: string;
	price: number;
	enabled: boolean;
}

interface Service {
	id: string;
	name: string;
	description: string;
	category: string;
	duration: number;
	imageUrl?: string;
	bodyTypePricing: BodyTypePricing[];
	features: {
		pickAndClean: boolean;
		atYourPlace: boolean;
		atShopOnly: boolean;
		expressService: boolean;
		parkingAvailable: boolean;
	};
	availability: {
		weekdays: boolean;
		weekends: boolean;
		specificDays: string[];
	};
	status: "active" | "inactive";
	createdAt: string;
	partnerId: string;
}

// Body types with default prices
const BODY_TYPES = [
	"Hatchback",
	"Sedan",
	"SUV",
	"Coupe",
	"Convertible",
	"Van",
	"Pickup Truck",
	"MPV/Minivan",
	"Station Wagon",
	"Crossover",
];

const DEFAULT_BODY_TYPE_PRICES: Record<string, number> = {
	Hatchback: 10,
	Sedan: 12,
	SUV: 15,
	Coupe: 12,
	Convertible: 14,
	Van: 18,
	"Pickup Truck": 16,
	"MPV/Minivan": 15,
	"Station Wagon": 13,
	Crossover: 14,
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// In-memory services store
const servicesStore = new Map<string, Service>();

// Generate mock services for demo partner
const generateMockServices = (partnerId: string) => {
	const mockServices: Service[] = [
		{
			id: faker.string.uuid(),
			name: "Basic Exterior Wash",
			description: "Quick exterior wash including rinse, soap, and hand dry.",
			category: "Basic Wash",
			duration: 30,
			imageUrl: faker.image.urlLoremFlickr({ category: "car" }),
			bodyTypePricing: BODY_TYPES.map((type) => ({
				bodyType: type,
				price: DEFAULT_BODY_TYPE_PRICES[type],
				enabled: true,
			})),
			features: {
				pickAndClean: true,
				atYourPlace: true,
				atShopOnly: true,
				expressService: true,
				parkingAvailable: true,
			},
			availability: {
				weekdays: true,
				weekends: true,
				specificDays: DAYS_OF_WEEK,
			},
			status: "active",
			createdAt: faker.date.past().toISOString().split("T")[0],
			partnerId,
		},
		{
			id: faker.string.uuid(),
			name: "Premium Full Detail",
			description: "Complete interior and exterior detailing with wax and polish.",
			category: "Full Detailing",
			duration: 180,
			imageUrl: faker.image.urlLoremFlickr({ category: "car" }),
			bodyTypePricing: BODY_TYPES.map((type) => ({
				bodyType: type,
				price: DEFAULT_BODY_TYPE_PRICES[type] * 3,
				enabled: true,
			})),
			features: {
				pickAndClean: true,
				atYourPlace: false,
				atShopOnly: true,
				expressService: false,
				parkingAvailable: true,
			},
			availability: {
				weekdays: true,
				weekends: false,
				specificDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
			},
			status: "active",
			createdAt: faker.date.past().toISOString().split("T")[0],
			partnerId,
		},
		{
			id: faker.string.uuid(),
			name: "Interior Deep Clean",
			description: "Thorough interior cleaning including seats, carpets, and dashboard.",
			category: "Interior Cleaning",
			duration: 90,
			imageUrl: faker.image.urlLoremFlickr({ category: "car" }),
			bodyTypePricing: BODY_TYPES.map((type) => ({
				bodyType: type,
				price: DEFAULT_BODY_TYPE_PRICES[type] * 2,
				enabled: true,
			})),
			features: {
				pickAndClean: true,
				atYourPlace: true,
				atShopOnly: true,
				expressService: false,
				parkingAvailable: true,
			},
			availability: {
				weekdays: true,
				weekends: true,
				specificDays: DAYS_OF_WEEK,
			},
			status: "inactive",
			createdAt: faker.date.past().toISOString().split("T")[0],
			partnerId,
		},
	];

	mockServices.forEach((service) => {
		servicesStore.set(service.id, service);
	});

	return mockServices;
};

// Initialize with demo partner services
generateMockServices("demo-partner-1");

// API Handlers
const getServices = http.get("/api/partner/services", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	const services = Array.from(servicesStore.values()).filter((service) => service.partnerId === partnerId);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { services },
	});
});

const getServiceById = http.get("/api/partner/services/:id", async ({ params }) => {
	await delay(200);

	const { id } = params;
	const service = servicesStore.get(id as string);

	if (!service) {
		return HttpResponse.json(
			{
				status: 10001,
				message: "Service not found",
			},
			{ status: 404 },
		);
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { service },
	});
});

const createService = http.post("/api/partner/services", async ({ request }) => {
	await delay(500);

	const body = (await request.json()) as Omit<Service, "id" | "createdAt">;

	const newService: Service = {
		...body,
		id: faker.string.uuid(),
		createdAt: new Date().toISOString().split("T")[0],
		partnerId: body.partnerId || "demo-partner-1",
	};

	servicesStore.set(newService.id, newService);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Service created successfully",
		data: { service: newService },
	});
});

const updateService = http.put("/api/partner/services/:id", async ({ params, request }) => {
	await delay(500);

	const { id } = params;
	const existingService = servicesStore.get(id as string);

	if (!existingService) {
		return HttpResponse.json(
			{
				status: 10001,
				message: "Service not found",
			},
			{ status: 404 },
		);
	}

	const updates = (await request.json()) as Partial<Service>;
	const updatedService: Service = {
		...existingService,
		...updates,
		id: existingService.id,
		createdAt: existingService.createdAt,
		partnerId: existingService.partnerId,
	};

	servicesStore.set(id as string, updatedService);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Service updated successfully",
		data: { service: updatedService },
	});
});

const deleteService = http.delete("/api/partner/services/:id", async ({ params }) => {
	await delay(300);

	const { id } = params;
	const service = servicesStore.get(id as string);

	if (!service) {
		return HttpResponse.json(
			{
				status: 10001,
				message: "Service not found",
			},
			{ status: 404 },
		);
	}

	servicesStore.delete(id as string);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Service deleted successfully",
	});
});

const toggleServiceStatus = http.patch("/api/partner/services/:id/status", async ({ params }) => {
	await delay(200);

	const { id } = params;
	const service = servicesStore.get(id as string);

	if (!service) {
		return HttpResponse.json(
			{
				status: 10001,
				message: "Service not found",
			},
			{ status: 404 },
		);
	}

	service.status = service.status === "active" ? "inactive" : "active";
	servicesStore.set(id as string, service);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: `Service ${service.status === "active" ? "activated" : "deactivated"} successfully`,
		data: { service },
	});
});

const duplicateService = http.post("/api/partner/services/:id/duplicate", async ({ params }) => {
	await delay(300);

	const { id } = params;
	const service = servicesStore.get(id as string);

	if (!service) {
		return HttpResponse.json(
			{
				status: 10001,
				message: "Service not found",
			},
			{ status: 404 },
		);
	}

	const duplicatedService: Service = {
		...service,
		id: faker.string.uuid(),
		name: `${service.name} (Copy)`,
		createdAt: new Date().toISOString().split("T")[0],
	};

	servicesStore.set(duplicatedService.id, duplicatedService);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Service duplicated successfully",
		data: { service: duplicatedService },
	});
});

// Get body types (for reference)
const getBodyTypes = http.get("/api/partner/body-types", async () => {
	await delay(100);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: {
			bodyTypes: BODY_TYPES,
			defaultPrices: DEFAULT_BODY_TYPE_PRICES,
		},
	});
});

export const partnerServicesHandlers = [
	getServices,
	getServiceById,
	createService,
	updateService,
	deleteService,
	toggleServiceStatus,
	duplicateService,
	getBodyTypes,
];
