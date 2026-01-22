import { faker } from "@faker-js/faker";
import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

// Types
interface Booking {
	id: string;
	date: string;
	time: string;
	customer: string;
	service: string;
	status: "pending" | "confirmed" | "in_progress" | "completed";
}

interface WorkingHours {
	day: string;
	open: string;
	close: string;
	isClosed: boolean;
}

interface BlockedDate {
	id: string;
	date: string;
	reason: string;
}

interface AvailabilitySettings {
	workingHours: WorkingHours[];
	blockedDates: BlockedDate[];
	bookingCapacity: number;
	slotDuration: number;
	serviceRadius: number;
}

// In-memory storage
const bookingsStore = new Map<string, Booking[]>();
const settingsStore = new Map<string, AvailabilitySettings>();

// Default working hours
const defaultWorkingHours: WorkingHours[] = [
	{ day: "Monday", open: "08:00", close: "18:00", isClosed: false },
	{ day: "Tuesday", open: "08:00", close: "18:00", isClosed: false },
	{ day: "Wednesday", open: "08:00", close: "18:00", isClosed: false },
	{ day: "Thursday", open: "08:00", close: "18:00", isClosed: false },
	{ day: "Friday", open: "08:00", close: "18:00", isClosed: false },
	{ day: "Saturday", open: "09:00", close: "14:00", isClosed: false },
	{ day: "Sunday", open: "00:00", close: "00:00", isClosed: true },
];

// Generate mock bookings for a partner
const generateMockBookings = (partnerId: string) => {
	const statuses: Booking["status"][] = ["pending", "confirmed", "in_progress", "completed"];
	const services = ["Basic Wash", "Premium Detail", "Interior Clean", "Full Detail"];
	const customers = ["John Smith", "Sarah Johnson", "Mike Brown", "Emily Davis", "James Wilson"];

	const today = new Date();
	const year = today.getFullYear();
	const month = today.getMonth();

	for (let day = 1; day <= 28; day++) {
		const date = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
		const numBookings = Math.floor(Math.random() * 5);

		if (numBookings > 0) {
			const dayBookings: Booking[] = [];
			for (let i = 0; i < numBookings; i++) {
				const hour = 8 + Math.floor(Math.random() * 10);
				dayBookings.push({
					id: faker.string.uuid(),
					date,
					time: `${hour.toString().padStart(2, "0")}:${Math.random() > 0.5 ? "00" : "30"}`,
					customer: customers[Math.floor(Math.random() * customers.length)],
					service: services[Math.floor(Math.random() * services.length)],
					status: statuses[Math.floor(Math.random() * statuses.length)],
				});
			}
			dayBookings.sort((a, b) => a.time.localeCompare(b.time));
			bookingsStore.set(`${partnerId}-${date}`, dayBookings);
		}
	}
};

// Initialize with default settings
const initializePartnerSettings = (partnerId: string) => {
	if (!settingsStore.has(partnerId)) {
		settingsStore.set(partnerId, {
			workingHours: [...defaultWorkingHours],
			blockedDates: [
				{ id: faker.string.uuid(), date: "2024-12-25", reason: "Christmas Day" },
				{ id: faker.string.uuid(), date: "2024-12-26", reason: "Boxing Day" },
			],
			bookingCapacity: 4,
			slotDuration: 30,
			serviceRadius: 15,
		});
		generateMockBookings(partnerId);
	}
};

// Initialize demo partner
initializePartnerSettings("demo-partner-1");

// API Handlers
const getCalendarBookings = http.get("/api/partner/calendar/bookings", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const month = url.searchParams.get("month");
	const year = url.searchParams.get("year");

	initializePartnerSettings(partnerId);

	const bookings: Record<string, Booking[]> = {};

	bookingsStore.forEach((dayBookings, key) => {
		if (key.startsWith(partnerId)) {
			const date = key.replace(`${partnerId}-`, "");
			if (month && year) {
				const [bookingYear, bookingMonth] = date.split("-");
				if (bookingYear === year && bookingMonth === month) {
					bookings[date] = dayBookings;
				}
			} else {
				bookings[date] = dayBookings;
			}
		}
	});

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { bookings },
	});
});

const getAvailabilitySettings = http.get("/api/partner/availability", async ({ request }) => {
	await delay(200);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerSettings(partnerId);
	const settings = settingsStore.get(partnerId);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { settings },
	});
});

const updateWorkingHours = http.put("/api/partner/availability/working-hours", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const { workingHours } = (await request.json()) as { workingHours: WorkingHours[] };

	initializePartnerSettings(partnerId);
	const settings = settingsStore.get(partnerId);

	if (settings) {
		settings.workingHours = workingHours;
		settingsStore.set(partnerId, settings);
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Working hours updated successfully",
		data: { workingHours },
	});
});

const addBlockedDate = http.post("/api/partner/availability/blocked-dates", async ({ request }) => {
	await delay(200);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const { date, reason } = (await request.json()) as { date: string; reason: string };

	initializePartnerSettings(partnerId);
	const settings = settingsStore.get(partnerId);

	const newBlockedDate: BlockedDate = {
		id: faker.string.uuid(),
		date,
		reason,
	};

	if (settings) {
		settings.blockedDates.push(newBlockedDate);
		settingsStore.set(partnerId, settings);
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Date blocked successfully",
		data: { blockedDate: newBlockedDate },
	});
});

const removeBlockedDate = http.delete("/api/partner/availability/blocked-dates/:id", async ({ params, request }) => {
	await delay(200);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerSettings(partnerId);
	const settings = settingsStore.get(partnerId);

	if (settings) {
		settings.blockedDates = settings.blockedDates.filter((bd) => bd.id !== id);
		settingsStore.set(partnerId, settings);
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Blocked date removed successfully",
	});
});

const updateBookingCapacity = http.put("/api/partner/availability/capacity", async ({ request }) => {
	await delay(200);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const { bookingCapacity, slotDuration } = (await request.json()) as {
		bookingCapacity: number;
		slotDuration: number;
	};

	initializePartnerSettings(partnerId);
	const settings = settingsStore.get(partnerId);

	if (settings) {
		settings.bookingCapacity = bookingCapacity;
		settings.slotDuration = slotDuration;
		settingsStore.set(partnerId, settings);
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Booking capacity updated successfully",
		data: { bookingCapacity, slotDuration },
	});
});

const updateServiceRadius = http.put("/api/partner/availability/radius", async ({ request }) => {
	await delay(200);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const { serviceRadius } = (await request.json()) as { serviceRadius: number };

	initializePartnerSettings(partnerId);
	const settings = settingsStore.get(partnerId);

	if (settings) {
		settings.serviceRadius = serviceRadius;
		settingsStore.set(partnerId, settings);
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Service radius updated successfully",
		data: { serviceRadius },
	});
});

const saveAllSettings = http.put("/api/partner/availability", async ({ request }) => {
	await delay(500);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const settings = (await request.json()) as AvailabilitySettings;

	settingsStore.set(partnerId, settings);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Settings saved successfully",
		data: { settings },
	});
});

export const partnerScheduleHandlers = [
	getCalendarBookings,
	getAvailabilitySettings,
	updateWorkingHours,
	addBlockedDate,
	removeBlockedDate,
	updateBookingCapacity,
	updateServiceRadius,
	saveAllSettings,
];
