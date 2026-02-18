import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

interface SettingsData {
	account: { email: string; phone: string };
	notifications: { newBooking: boolean; newReview: boolean; customerMessage: boolean };
}

const settingsStore = new Map<string, SettingsData>();

const generateMockSettings = (): SettingsData => ({
	account: {
		email: "partner@example.com",
		phone: "+353 86 123 4567",
	},
	notifications: {
		newBooking: true,
		newReview: true,
		customerMessage: true,
	},
});

const initializePartnerData = (partnerId: string) => {
	if (!settingsStore.has(partnerId)) {
		settingsStore.set(partnerId, generateMockSettings());
	}
};

initializePartnerData("demo-partner-1");

const getSettings = http.get("/api/partner/settings", async ({ request }) => {
	await delay(300);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	initializePartnerData(partnerId);
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { settings: settingsStore.get(partnerId) },
	});
});

const updateSettings = http.put("/api/partner/settings", async ({ request }) => {
	await delay(300);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as Partial<SettingsData>;
	initializePartnerData(partnerId);
	const current = settingsStore.get(partnerId);
	if (!current) {
		return HttpResponse.json({ status: 10001, message: "Settings not found" }, { status: 404 });
	}
	const updated = { ...current, ...body };
	settingsStore.set(partnerId, updated);
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Settings updated successfully",
		data: { settings: updated },
	});
});

const changePassword = http.post("/api/partner/settings/password", async ({ request }) => {
	await delay(500);
	const body = (await request.json()) as { currentPassword: string; newPassword: string };
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

export const partnerSettingsHandlers = [getSettings, updateSettings, changePassword];
