import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

// Types
interface BusinessHours {
	day: string;
	isOpen: boolean;
	openTime: string;
	closeTime: string;
}

interface Holiday {
	id: string;
	name: string;
	date: string;
}

interface Document {
	id: string;
	type: "business_registration" | "business_insurance" | "motor_trade_insurance";
	name: string;
	url: string;
	expiryDate: string;
	status: "pending" | "approved" | "rejected" | "expired";
	uploadedAt: string;
}

interface GalleryImage {
	id: string;
	url: string;
	order: number;
}

interface BusinessProfile {
	name: string;
	description: string;
	logoUrl: string;
	coverPhotoUrl: string;
	gallery: GalleryImage[];
	phone: string;
	email: string;
	address: string;
	latitude: number;
	longitude: number;
	serviceRadius: number;
	businessHours: BusinessHours[];
	holidays: Holiday[];
	documents: Document[];
	socialMedia: {
		facebook: string;
		instagram: string;
	};
}

// In-memory storage
const profileStore = new Map<string, BusinessProfile>();

// Generate mock profile
const generateMockProfile = (partnerId: string): BusinessProfile => {
	return {
		name: "Premium Auto Detailing",
		description:
			"Professional mobile car wash and detailing service. We bring the car wash to you with eco-friendly products and exceptional results. Over 10 years of experience serving the Dublin area.",
		logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
		coverPhotoUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1200&h=400&fit=crop",
		gallery: [
			{ id: `${partnerId}-g1`, url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400", order: 1 },
			{ id: `${partnerId}-g2`, url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", order: 2 },
			{ id: `${partnerId}-g3`, url: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400", order: 3 },
		],
		phone: "+353 86 123 4567",
		email: "info@premiumautodetailing.ie",
		address: "123 Main Street, Dublin 2, D02 AB12, Ireland",
		latitude: 53.3498,
		longitude: -6.2603,
		serviceRadius: 25,
		businessHours: [
			{ day: "Monday", isOpen: true, openTime: "08:00", closeTime: "18:00" },
			{ day: "Tuesday", isOpen: true, openTime: "08:00", closeTime: "18:00" },
			{ day: "Wednesday", isOpen: true, openTime: "08:00", closeTime: "18:00" },
			{ day: "Thursday", isOpen: true, openTime: "08:00", closeTime: "18:00" },
			{ day: "Friday", isOpen: true, openTime: "08:00", closeTime: "18:00" },
			{ day: "Saturday", isOpen: true, openTime: "09:00", closeTime: "16:00" },
			{ day: "Sunday", isOpen: false, openTime: "09:00", closeTime: "16:00" },
		],
		holidays: [
			{ id: `${partnerId}-h1`, name: "Christmas Day", date: "2025-12-25" },
			{ id: `${partnerId}-h2`, name: "New Year's Day", date: "2026-01-01" },
		],
		documents: [
			{
				id: `${partnerId}-doc1`,
				type: "business_registration",
				name: "Business Registration Certificate",
				url: "/uploads/business-reg.pdf",
				expiryDate: "2026-06-15",
				status: "approved",
				uploadedAt: "2024-06-15",
			},
			{
				id: `${partnerId}-doc2`,
				type: "business_insurance",
				name: "Business Insurance Policy",
				url: "/uploads/business-insurance.pdf",
				expiryDate: "2025-03-20",
				status: "approved",
				uploadedAt: "2024-03-20",
			},
			{
				id: `${partnerId}-doc3`,
				type: "motor_trade_insurance",
				name: "Motor Trade Insurance",
				url: "/uploads/motor-trade.pdf",
				expiryDate: "2025-01-15",
				status: "expired",
				uploadedAt: "2024-01-15",
			},
		],
		socialMedia: {
			facebook: "https://facebook.com/premiumautodetailing",
			instagram: "https://instagram.com/premiumautodetailing",
		},
	};
};

// Initialize partner data
const initializePartnerData = (partnerId: string) => {
	if (!profileStore.has(partnerId)) {
		profileStore.set(partnerId, generateMockProfile(partnerId));
	}
};

// Initialize demo partner
initializePartnerData("demo-partner-1");

// API Handlers
const getProfile = http.get("/api/partner/profile", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const profile = profileStore.get(partnerId);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { profile },
	});
});

const updateProfile = http.put("/api/partner/profile", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as Partial<BusinessProfile>;

	initializePartnerData(partnerId);
	const currentProfile = profileStore.get(partnerId);

	if (!currentProfile) {
		return HttpResponse.json({ status: 10001, message: "Profile not found" }, { status: 404 });
	}

	const updatedProfile = { ...currentProfile, ...body };
	profileStore.set(partnerId, updatedProfile);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Profile updated successfully",
		data: { profile: updatedProfile },
	});
});

const updateBusinessHours = http.put("/api/partner/profile/hours", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as { businessHours: BusinessHours[] };

	initializePartnerData(partnerId);
	const currentProfile = profileStore.get(partnerId);

	if (!currentProfile) {
		return HttpResponse.json({ status: 10001, message: "Profile not found" }, { status: 404 });
	}

	currentProfile.businessHours = body.businessHours;
	profileStore.set(partnerId, currentProfile);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Business hours updated",
	});
});

const addHoliday = http.post("/api/partner/profile/holidays", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as { name: string; date: string };

	initializePartnerData(partnerId);
	const currentProfile = profileStore.get(partnerId);

	if (!currentProfile) {
		return HttpResponse.json({ status: 10001, message: "Profile not found" }, { status: 404 });
	}

	const newHoliday: Holiday = {
		id: `${partnerId}-h-${Date.now()}`,
		name: body.name,
		date: body.date,
	};

	currentProfile.holidays.push(newHoliday);
	profileStore.set(partnerId, currentProfile);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Holiday added",
		data: { holiday: newHoliday },
	});
});

const removeHoliday = http.delete("/api/partner/profile/holidays/:id", async ({ params, request }) => {
	await delay(200);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const currentProfile = profileStore.get(partnerId);

	if (!currentProfile) {
		return HttpResponse.json({ status: 10001, message: "Profile not found" }, { status: 404 });
	}

	currentProfile.holidays = currentProfile.holidays.filter((h) => h.id !== id);
	profileStore.set(partnerId, currentProfile);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Holiday removed",
	});
});

const uploadDocument = http.post("/api/partner/profile/documents", async ({ request }) => {
	await delay(500);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as { type: Document["type"]; expiryDate: string };

	initializePartnerData(partnerId);
	const currentProfile = profileStore.get(partnerId);

	if (!currentProfile) {
		return HttpResponse.json({ status: 10001, message: "Profile not found" }, { status: 404 });
	}

	const docNames: Record<Document["type"], string> = {
		business_registration: "Business Registration Certificate",
		business_insurance: "Business Insurance Policy",
		motor_trade_insurance: "Motor Trade Insurance",
	};

	const docIndex = currentProfile.documents.findIndex((d) => d.type === body.type);
	const newDoc: Document = {
		id: `${partnerId}-doc-${Date.now()}`,
		type: body.type,
		name: docNames[body.type],
		url: `/uploads/${body.type}-${Date.now()}.pdf`,
		expiryDate: body.expiryDate,
		status: "pending",
		uploadedAt: new Date().toISOString().split("T")[0],
	};

	if (docIndex >= 0) {
		currentProfile.documents[docIndex] = newDoc;
	} else {
		currentProfile.documents.push(newDoc);
	}

	profileStore.set(partnerId, currentProfile);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Document uploaded successfully. Pending admin approval.",
		data: { document: newDoc },
	});
});

const addGalleryImage = http.post("/api/partner/profile/gallery", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as { url: string };

	initializePartnerData(partnerId);
	const currentProfile = profileStore.get(partnerId);

	if (!currentProfile) {
		return HttpResponse.json({ status: 10001, message: "Profile not found" }, { status: 404 });
	}

	if (currentProfile.gallery.length >= 10) {
		return HttpResponse.json({ status: 10002, message: "Gallery limit reached (10 photos)" }, { status: 400 });
	}

	const newImage: GalleryImage = {
		id: `${partnerId}-g-${Date.now()}`,
		url: body.url,
		order: currentProfile.gallery.length + 1,
	};

	currentProfile.gallery.push(newImage);
	profileStore.set(partnerId, currentProfile);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Image added to gallery",
		data: { image: newImage },
	});
});

const removeGalleryImage = http.delete("/api/partner/profile/gallery/:id", async ({ params, request }) => {
	await delay(200);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const currentProfile = profileStore.get(partnerId);

	if (!currentProfile) {
		return HttpResponse.json({ status: 10001, message: "Profile not found" }, { status: 404 });
	}

	currentProfile.gallery = currentProfile.gallery.filter((g) => g.id !== id);
	// Reorder remaining images
	currentProfile.gallery.forEach((g, index) => {
		g.order = index + 1;
	});
	profileStore.set(partnerId, currentProfile);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Image removed from gallery",
	});
});

const reorderGallery = http.put("/api/partner/profile/gallery/reorder", async ({ request }) => {
	await delay(200);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as { imageIds: string[] };

	initializePartnerData(partnerId);
	const currentProfile = profileStore.get(partnerId);

	if (!currentProfile) {
		return HttpResponse.json({ status: 10001, message: "Profile not found" }, { status: 404 });
	}

	// Reorder based on provided order
	const reorderedGallery = body.imageIds
		.map((id, index) => {
			const image = currentProfile.gallery.find((g) => g.id === id);
			if (image) {
				return { ...image, order: index + 1 };
			}
			return null;
		})
		.filter((g): g is GalleryImage => g !== null);

	currentProfile.gallery = reorderedGallery;
	profileStore.set(partnerId, currentProfile);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Gallery reordered",
	});
});

export const partnerProfileHandlers = [
	getProfile,
	updateProfile,
	updateBusinessHours,
	addHoliday,
	removeHoliday,
	uploadDocument,
	addGalleryImage,
	removeGalleryImage,
	reorderGallery,
];
