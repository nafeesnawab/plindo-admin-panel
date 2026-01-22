import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

// Types
interface Driver {
	id: string;
	fullName: string;
	phone: string;
	email: string;
	licenseNumber: string;
	licenseUrl?: string;
	licenseExpiry: string;
	insuranceUrl?: string;
	insuranceExpiry: string;
	photoUrl?: string;
	status: "active" | "inactive";
	createdAt: string;
}

// In-memory storage
const driversStore = new Map<string, Driver[]>();

// Generate mock drivers
const generateMockDrivers = (partnerId: string): Driver[] => {
	return [
		{
			id: `${partnerId}-d1`,
			fullName: "James Wilson",
			phone: "+1 (555) 123-4567",
			email: "james.wilson@email.com",
			licenseNumber: "DL-123456789",
			licenseUrl: "/uploads/license-james.pdf",
			licenseExpiry: "2025-03-15",
			insuranceUrl: "/uploads/insurance-james.pdf",
			insuranceExpiry: "2025-06-20",
			photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
			status: "active",
			createdAt: "2024-01-15",
		},
		{
			id: `${partnerId}-d2`,
			fullName: "Michael Chen",
			phone: "+1 (555) 234-5678",
			email: "michael.chen@email.com",
			licenseNumber: "DL-987654321",
			licenseUrl: "/uploads/license-michael.pdf",
			licenseExpiry: "2026-01-10",
			insuranceUrl: "/uploads/insurance-michael.pdf",
			insuranceExpiry: "2025-01-25",
			photoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
			status: "active",
			createdAt: "2024-02-20",
		},
		{
			id: `${partnerId}-d3`,
			fullName: "David Rodriguez",
			phone: "+1 (555) 345-6789",
			email: "david.r@email.com",
			licenseNumber: "DL-456789123",
			licenseExpiry: "2024-12-01",
			insuranceExpiry: "2024-11-15",
			status: "inactive",
			createdAt: "2024-03-10",
		},
		{
			id: `${partnerId}-d4`,
			fullName: "Robert Taylor",
			phone: "+1 (555) 456-7890",
			email: "robert.taylor@email.com",
			licenseNumber: "DL-789123456",
			licenseUrl: "/uploads/license-robert.pdf",
			licenseExpiry: "2025-08-30",
			insuranceUrl: "/uploads/insurance-robert.pdf",
			insuranceExpiry: "2025-09-15",
			photoUrl: "https://randomuser.me/api/portraits/men/67.jpg",
			status: "active",
			createdAt: "2024-04-05",
		},
	];
};

// Initialize partner data
const initializePartnerData = (partnerId: string) => {
	if (!driversStore.has(partnerId)) {
		driversStore.set(partnerId, generateMockDrivers(partnerId));
	}
};

// Initialize demo partner
initializePartnerData("demo-partner-1");

// API Handlers
const getDrivers = http.get("/api/partner/drivers", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const status = url.searchParams.get("status");
	const search = url.searchParams.get("search");

	initializePartnerData(partnerId);
	let drivers = driversStore.get(partnerId) || [];

	// Apply filters
	if (status && status !== "all") {
		drivers = drivers.filter((d) => d.status === status);
	}

	if (search) {
		const query = search.toLowerCase();
		drivers = drivers.filter(
			(d) =>
				d.fullName.toLowerCase().includes(query) ||
				d.phone.includes(query) ||
				d.email.toLowerCase().includes(query) ||
				d.licenseNumber.toLowerCase().includes(query),
		);
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { drivers },
	});
});

const getActiveDrivers = http.get("/api/partner/drivers/active", async ({ request }) => {
	await delay(200);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const drivers = (driversStore.get(partnerId) || []).filter((d) => d.status === "active");

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { drivers },
	});
});

const getDriver = http.get("/api/partner/drivers/:id", async ({ params, request }) => {
	await delay(200);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const drivers = driversStore.get(partnerId) || [];
	const driver = drivers.find((d) => d.id === id);

	if (!driver) {
		return HttpResponse.json({ status: 10001, message: "Driver not found" }, { status: 404 });
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { driver },
	});
});

const createDriver = http.post("/api/partner/drivers", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as Omit<Driver, "id" | "createdAt">;

	initializePartnerData(partnerId);
	const drivers = driversStore.get(partnerId) || [];

	const newDriver: Driver = {
		...body,
		id: `${partnerId}-d-${Date.now()}`,
		createdAt: new Date().toISOString(),
	};

	drivers.unshift(newDriver);
	driversStore.set(partnerId, drivers);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Driver created successfully",
		data: { driver: newDriver },
	});
});

const updateDriver = http.put("/api/partner/drivers/:id", async ({ params, request }) => {
	await delay(300);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as Partial<Driver>;

	initializePartnerData(partnerId);
	const drivers = driversStore.get(partnerId) || [];
	const driverIndex = drivers.findIndex((d) => d.id === id);

	if (driverIndex === -1) {
		return HttpResponse.json({ status: 10001, message: "Driver not found" }, { status: 404 });
	}

	drivers[driverIndex] = { ...drivers[driverIndex], ...body };
	driversStore.set(partnerId, drivers);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Driver updated successfully",
		data: { driver: drivers[driverIndex] },
	});
});

const deleteDriver = http.delete("/api/partner/drivers/:id", async ({ params, request }) => {
	await delay(300);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const drivers = driversStore.get(partnerId) || [];
	const driverIndex = drivers.findIndex((d) => d.id === id);

	if (driverIndex === -1) {
		return HttpResponse.json({ status: 10001, message: "Driver not found" }, { status: 404 });
	}

	drivers.splice(driverIndex, 1);
	driversStore.set(partnerId, drivers);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Driver deleted successfully",
	});
});

const assignDriverToBooking = http.post(
	"/api/partner/bookings/:bookingId/assign-driver",
	async ({ params, request }) => {
		await delay(300);

		const { bookingId } = params;
		const body = (await request.json()) as { driverId: string };

		// In a real app, we'd update the booking with the driver assignment
		// For now, just return success
		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			message: `Driver assigned to booking ${bookingId}`,
			data: { bookingId, driverId: body.driverId },
		});
	},
);

const getExpiringDocuments = http.get("/api/partner/drivers/expiring", async ({ request }) => {
	await delay(200);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const days = Number.parseInt(url.searchParams.get("days") || "30", 10);

	initializePartnerData(partnerId);
	const drivers = driversStore.get(partnerId) || [];

	const now = new Date();
	const threshold = new Date();
	threshold.setDate(threshold.getDate() + days);

	const expiringDrivers = drivers.filter((d) => {
		if (d.status !== "active") return false;
		const licenseExpiry = new Date(d.licenseExpiry);
		const insuranceExpiry = new Date(d.insuranceExpiry);
		return (
			(licenseExpiry <= threshold && licenseExpiry >= now) ||
			(insuranceExpiry <= threshold && insuranceExpiry >= now) ||
			licenseExpiry < now ||
			insuranceExpiry < now
		);
	});

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { drivers: expiringDrivers, count: expiringDrivers.length },
	});
});

export const partnerDriversHandlers = [
	getDrivers,
	getActiveDrivers,
	getDriver,
	createDriver,
	updateDriver,
	deleteDriver,
	assignDriverToBooking,
	getExpiringDocuments,
];
