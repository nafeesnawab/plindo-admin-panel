import { faker } from "@faker-js/faker";
import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

// Service Types
export type ServiceType = "book_me" | "pick_by_me" | "washing_van";

// Car pricing for a specific car model
export interface CarPricing {
	carId: string;
	make: string;
	model: string;
	bodyType: string;
	price: number;
}

// Distance charges for pick_by_me service type only (max 3km)
export interface DistanceCharges {
	"0-1km": number;
	"1-2km": number;
	"2-3km": number;
}

// Service interface with new fields
export interface Service {
	id: string;
	name: string;
	description: string;
	category: string;
	serviceType: ServiceType;
	duration: number;
	bannerUrl?: string;
	carPricing: CarPricing[];
	distanceCharges?: DistanceCharges;
	additionalCharges?: {
		name: string;
		amount: number;
	}[];
	features: {
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

// Service categories
export const SERVICE_CATEGORIES = [
	"Basic Wash",
	"Premium Wash",
	"Interior Cleaning",
	"Full Detailing",
	"Express Wash",
	"Specialty Services",
];

// Service type labels
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
	book_me: "Book Me (Customer drives to station)",
	pick_by_me: "Pick By Me (Driver picks up car)",
	washing_van: "Washing Van (Service at doorstep)",
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
			description: "Quick exterior wash including rinse, soap, and hand dry. Customer drives to our station.",
			category: "Basic Wash",
			serviceType: "book_me",
			duration: 30,
			bannerUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
			carPricing: [
				{ carId: "1", make: "Toyota", model: "Corolla", bodyType: "Sedan", price: 12 },
				{ carId: "2", make: "Toyota", model: "Camry", bodyType: "Sedan", price: 14 },
				{ carId: "3", make: "Toyota", model: "RAV4", bodyType: "SUV", price: 18 },
				{ carId: "4", make: "Honda", model: "Civic", bodyType: "Sedan", price: 12 },
				{ carId: "5", make: "Honda", model: "CR-V", bodyType: "SUV", price: 18 },
				{ carId: "6", make: "BMW", model: "3 Series", bodyType: "Sedan", price: 15 },
				{ carId: "7", make: "BMW", model: "X5", bodyType: "SUV", price: 22 },
			],
			features: {
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
			name: "Premium Full Detail - Pick Up",
			description: "Complete interior and exterior detailing. We pick up your car and deliver it back sparkling clean.",
			category: "Full Detailing",
			serviceType: "pick_by_me",
			duration: 180,
			bannerUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800",
			carPricing: [
				{ carId: "1", make: "Toyota", model: "Corolla", bodyType: "Sedan", price: 45 },
				{ carId: "2", make: "Toyota", model: "Camry", bodyType: "Sedan", price: 50 },
				{ carId: "3", make: "Toyota", model: "RAV4", bodyType: "SUV", price: 60 },
				{ carId: "4", make: "Honda", model: "Civic", bodyType: "Sedan", price: 45 },
				{ carId: "5", make: "Honda", model: "CR-V", bodyType: "SUV", price: 60 },
				{ carId: "6", make: "BMW", model: "3 Series", bodyType: "Sedan", price: 55 },
				{ carId: "7", make: "BMW", model: "X5", bodyType: "SUV", price: 75 },
				{ carId: "8", make: "Mercedes-Benz", model: "C-Class", bodyType: "Sedan", price: 55 },
				{ carId: "9", make: "Mercedes-Benz", model: "GLE", bodyType: "SUV", price: 80 },
			],
			distanceCharges: {
				"0-1km": 3,
				"1-2km": 5,
				"2-3km": 8,
			},
			features: {
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
			name: "Doorstep Express Wash",
			description: "Our washing van comes to your doorstep. Professional wash without leaving your home.",
			category: "Express Wash",
			serviceType: "washing_van",
			duration: 45,
			bannerUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
			carPricing: [
				{ carId: "1", make: "Toyota", model: "Corolla", bodyType: "Sedan", price: 20 },
				{ carId: "2", make: "Toyota", model: "Camry", bodyType: "Sedan", price: 22 },
				{ carId: "3", make: "Toyota", model: "RAV4", bodyType: "SUV", price: 28 },
				{ carId: "4", make: "Honda", model: "Civic", bodyType: "Sedan", price: 20 },
				{ carId: "5", make: "Honda", model: "CR-V", bodyType: "SUV", price: 28 },
				{ carId: "6", make: "BMW", model: "3 Series", bodyType: "Sedan", price: 25 },
				{ carId: "7", make: "BMW", model: "X5", bodyType: "SUV", price: 35 },
			],
			additionalCharges: [{ name: "Van dispatch fee", amount: 5 }],
			features: {
				expressService: true,
				parkingAvailable: false,
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
			name: "Interior Deep Clean",
			description: "Thorough interior cleaning including seats, carpets, and dashboard at our station.",
			category: "Interior Cleaning",
			serviceType: "book_me",
			duration: 90,
			carPricing: [
				{ carId: "1", make: "Toyota", model: "Corolla", bodyType: "Sedan", price: 25 },
				{ carId: "2", make: "Toyota", model: "Camry", bodyType: "Sedan", price: 28 },
				{ carId: "3", make: "Toyota", model: "RAV4", bodyType: "SUV", price: 35 },
				{ carId: "4", make: "Honda", model: "Civic", bodyType: "Sedan", price: 25 },
				{ carId: "5", make: "Honda", model: "CR-V", bodyType: "SUV", price: 35 },
			],
			features: {
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

// Get service types
const getServiceTypes = http.get("/api/partner/service-types", async () => {
	await delay(100);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: {
			serviceTypes: Object.keys(SERVICE_TYPE_LABELS),
			serviceTypeLabels: SERVICE_TYPE_LABELS,
			categories: SERVICE_CATEGORIES,
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
	getServiceTypes,
];
