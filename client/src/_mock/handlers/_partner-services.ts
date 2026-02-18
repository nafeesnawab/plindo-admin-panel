import { faker } from "@faker-js/faker";
import { delay, HttpResponse, http } from "msw";
import type { ServiceCategory } from "@/types/booking";
import { ResultStatus } from "@/types/enum";
import { CAR_BODY_TYPES } from "./_cars";

export type ServiceType = "book_me" | "pick_by_me" | "washing_van";

export interface BodyTypePricing {
	bodyType: string;
	price: number;
}

export interface CarOverride {
	carId: string;
	make: string;
	model: string;
	bodyType: string;
	price: number;
}

export interface DistanceCharges {
	"0-1km": number;
	"1-2km": number;
	"2-3km": number;
}

export interface Service {
	id: string;
	name: string;
	description: string;
	serviceCategory: ServiceCategory;
	serviceType: ServiceType;
	duration: number;
	bannerUrl?: string;
	bodyTypePricing: BodyTypePricing[];
	carOverrides: CarOverride[];
	distanceCharges?: DistanceCharges;
	status: "active" | "inactive";
	createdAt: string;
	partnerId: string;
}

const servicesStore = new Map<string, Service>();

const makeBodyTypePricing = (baseMultipliers: Record<string, number>): BodyTypePricing[] =>
	CAR_BODY_TYPES.map((bt) => ({
		bodyType: bt,
		price: baseMultipliers[bt] ?? 15,
	}));

const generateMockServices = (partnerId: string) => {
	const mockServices: Service[] = [
		{
			id: faker.string.uuid(),
			name: "Basic Exterior Wash",
			description: "Quick exterior wash including rinse, soap, and hand dry. Customer drives to our station.",
			serviceCategory: "wash",
			serviceType: "book_me",
			duration: 30,
			bannerUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
			bodyTypePricing: makeBodyTypePricing({
				Hatchback: 10,
				Sedan: 12,
				SUV: 18,
				Coupe: 14,
				Convertible: 16,
				Van: 22,
				"Pickup Truck": 22,
				"MPV/Minivan": 20,
				"Station Wagon": 14,
				Crossover: 16,
			}),
			carOverrides: [
				{ carId: "bmw-x5", make: "BMW", model: "X5", bodyType: "SUV", price: 22 },
				{ carId: "merc-gle", make: "Mercedes-Benz", model: "GLE", bodyType: "SUV", price: 24 },
			],
			status: "active",
			createdAt: faker.date.past().toISOString().split("T")[0],
			partnerId,
		},
		{
			id: faker.string.uuid(),
			name: "Premium Full Detail - Pick Up",
			description: "Complete interior and exterior detailing. We pick up your car and deliver it back sparkling clean.",
			serviceCategory: "detailing",
			serviceType: "pick_by_me",
			duration: 180,
			bannerUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800",
			bodyTypePricing: makeBodyTypePricing({
				Hatchback: 35,
				Sedan: 45,
				SUV: 60,
				Coupe: 50,
				Convertible: 55,
				Van: 70,
				"Pickup Truck": 70,
				"MPV/Minivan": 65,
				"Station Wagon": 48,
				Crossover: 55,
			}),
			carOverrides: [
				{ carId: "bmw-x5", make: "BMW", model: "X5", bodyType: "SUV", price: 75 },
				{ carId: "merc-gle", make: "Mercedes-Benz", model: "GLE", bodyType: "SUV", price: 80 },
				{ carId: "porsche-911", make: "Porsche", model: "911", bodyType: "Coupe", price: 90 },
			],
			distanceCharges: {
				"0-1km": 3,
				"1-2km": 5,
				"2-3km": 8,
			},
			status: "active",
			createdAt: faker.date.past().toISOString().split("T")[0],
			partnerId,
		},
		{
			id: faker.string.uuid(),
			name: "Doorstep Express Wash",
			description: "Our washing van comes to your doorstep. Professional wash without leaving your home.",
			serviceCategory: "wash",
			serviceType: "washing_van",
			duration: 45,
			bannerUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
			bodyTypePricing: makeBodyTypePricing({
				Hatchback: 18,
				Sedan: 20,
				SUV: 28,
				Coupe: 22,
				Convertible: 24,
				Van: 32,
				"Pickup Truck": 32,
				"MPV/Minivan": 30,
				"Station Wagon": 22,
				Crossover: 24,
			}),
			carOverrides: [],
			status: "active",
			createdAt: faker.date.past().toISOString().split("T")[0],
			partnerId,
		},
		{
			id: faker.string.uuid(),
			name: "Interior Deep Clean",
			description: "Thorough interior cleaning including seats, carpets, and dashboard at our station.",
			serviceCategory: "detailing",
			serviceType: "book_me",
			duration: 90,
			bodyTypePricing: makeBodyTypePricing({
				Hatchback: 20,
				Sedan: 25,
				SUV: 35,
				Coupe: 28,
				Convertible: 30,
				Van: 40,
				"Pickup Truck": 40,
				"MPV/Minivan": 38,
				"Station Wagon": 28,
				Crossover: 30,
			}),
			carOverrides: [],
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

generateMockServices("demo-partner-1");

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
		return HttpResponse.json({ status: 10001, message: "Service not found" }, { status: 404 });
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
		return HttpResponse.json({ status: 10001, message: "Service not found" }, { status: 404 });
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
		return HttpResponse.json({ status: 10001, message: "Service not found" }, { status: 404 });
	}
	servicesStore.delete(id as string);
	return HttpResponse.json({ status: ResultStatus.SUCCESS, message: "Service deleted successfully" });
});

const toggleServiceStatus = http.patch("/api/partner/services/:id/status", async ({ params }) => {
	await delay(200);
	const { id } = params;
	const service = servicesStore.get(id as string);
	if (!service) {
		return HttpResponse.json({ status: 10001, message: "Service not found" }, { status: 404 });
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
		return HttpResponse.json({ status: 10001, message: "Service not found" }, { status: 404 });
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

export const partnerServicesHandlers = [
	getServices,
	getServiceById,
	createService,
	updateService,
	deleteService,
	toggleServiceStatus,
	duplicateService,
];
