import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

// Types
interface NotificationSettings {
	newBooking: boolean;
	paymentConfirmation: boolean;
	newReview: boolean;
	customerMessage: boolean;
	documentExpiry: boolean;
	promotional: boolean;
}

interface NotificationMethods {
	push: boolean;
	email: boolean;
	sms: boolean;
}

interface BankDetails {
	bankName: string;
	accountName: string;
	iban: string;
	bic: string;
}

interface AccountSettings {
	email: string;
	phone: string;
}

interface SettingsData {
	account: AccountSettings;
	notifications: NotificationSettings;
	notificationMethods: NotificationMethods;
	bankDetails: BankDetails;
	commissionRate: number;
}

// In-memory storage
const settingsStore = new Map<string, SettingsData>();

// Generate mock settings
const generateMockSettings = (): SettingsData => {
	return {
		account: {
			email: "partner@example.com",
			phone: "+353 86 123 4567",
		},
		notifications: {
			newBooking: true,
			paymentConfirmation: true,
			newReview: true,
			customerMessage: true,
			documentExpiry: true,
			promotional: false,
		},
		notificationMethods: {
			push: true,
			email: true,
			sms: false,
		},
		bankDetails: {
			bankName: "Bank of Ireland",
			accountName: "Premium Auto Detailing Ltd",
			iban: "IE29 AIBK 9311 5212 3456 78",
			bic: "BOFIIE2D",
		},
		commissionRate: 10,
	};
};

// Initialize partner data
const initializePartnerData = (partnerId: string) => {
	if (!settingsStore.has(partnerId)) {
		settingsStore.set(partnerId, generateMockSettings());
	}
};

// Initialize demo partner
initializePartnerData("demo-partner-1");

// API Handlers
const getSettings = http.get("/api/partner/settings", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const settings = settingsStore.get(partnerId);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { settings },
	});
});

const updateSettings = http.put("/api/partner/settings", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as Partial<SettingsData>;

	initializePartnerData(partnerId);
	const currentSettings = settingsStore.get(partnerId);

	if (!currentSettings) {
		return HttpResponse.json({ status: 10001, message: "Settings not found" }, { status: 404 });
	}

	const updatedSettings = { ...currentSettings, ...body };
	settingsStore.set(partnerId, updatedSettings);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Settings updated successfully",
		data: { settings: updatedSettings },
	});
});

const updateAccount = http.put("/api/partner/settings/account", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as AccountSettings;

	initializePartnerData(partnerId);
	const currentSettings = settingsStore.get(partnerId);

	if (!currentSettings) {
		return HttpResponse.json({ status: 10001, message: "Settings not found" }, { status: 404 });
	}

	currentSettings.account = body;
	settingsStore.set(partnerId, currentSettings);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Account updated successfully",
	});
});

const changePassword = http.post("/api/partner/settings/password", async ({ request }) => {
	await delay(500);

	const body = (await request.json()) as {
		currentPassword: string;
		newPassword: string;
	};

	// Simulate password validation
	if (body.currentPassword === "wrong") {
		return HttpResponse.json({ status: 10002, message: "Current password is incorrect" }, { status: 400 });
	}

	if (body.newPassword.length < 8) {
		return HttpResponse.json({ status: 10003, message: "Password must be at least 8 characters" }, { status: 400 });
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Password changed successfully",
	});
});

const updateNotifications = http.put("/api/partner/settings/notifications", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as {
		notifications: NotificationSettings;
		notificationMethods: NotificationMethods;
	};

	initializePartnerData(partnerId);
	const currentSettings = settingsStore.get(partnerId);

	if (!currentSettings) {
		return HttpResponse.json({ status: 10001, message: "Settings not found" }, { status: 404 });
	}

	currentSettings.notifications = body.notifications;
	currentSettings.notificationMethods = body.notificationMethods;
	settingsStore.set(partnerId, currentSettings);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Notification preferences updated",
	});
});

const updateBankDetails = http.put("/api/partner/settings/bank", async ({ request }) => {
	await delay(500);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as BankDetails;

	initializePartnerData(partnerId);
	const currentSettings = settingsStore.get(partnerId);

	if (!currentSettings) {
		return HttpResponse.json({ status: 10001, message: "Settings not found" }, { status: 404 });
	}

	// Validate IBAN format (simple check)
	if (!body.iban || body.iban.length < 15) {
		return HttpResponse.json({ status: 10004, message: "Invalid IBAN format" }, { status: 400 });
	}

	currentSettings.bankDetails = body;
	settingsStore.set(partnerId, currentSettings);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Bank details updated successfully",
	});
});

export const partnerSettingsHandlers = [
	getSettings,
	updateSettings,
	updateAccount,
	changePassword,
	updateNotifications,
	updateBankDetails,
];
