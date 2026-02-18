import { ResultStatus } from "@/types/enum";
import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

export enum NotificationApi {
	Send = "/notifications/send",
	History = "/notifications/history",
	Details = "/notifications/:id",
}

const recipientTypes = ["all_users", "all_customers", "all_partners", "specific_user"] as const;
const notificationTypes = ["push", "email", "both"] as const;
const deliveryStatuses = ["sent", "delivered", "failed", "partial"] as const;

const generateNotification = () => {
	const recipientType = faker.helpers.arrayElement(recipientTypes);
	const sentCount = faker.number.int({ min: 100, max: 5000 });
	const deliveredCount = Math.floor(sentCount * faker.number.float({ min: 0.85, max: 0.99 }));
	const openedCount = Math.floor(deliveredCount * faker.number.float({ min: 0.15, max: 0.45 }));

	return {
		id: faker.string.uuid(),
		title: faker.helpers.arrayElement([
			"New Feature Available!",
			"Special Discount This Weekend",
			"Service Reminder",
			"Account Update Required",
			"Welcome to PLINDO",
			"Your Weekly Summary",
			"Holiday Hours Notice",
			"New Partner Nearby",
			"Rate Your Last Wash",
			"Subscription Renewal Reminder",
		]),
		body: faker.lorem.paragraph(),
		recipientType,
		recipientName: recipientType === "specific_user" ? faker.person.fullName() : null,
		notificationType: faker.helpers.arrayElement(notificationTypes),
		scheduledAt: faker.helpers.maybe(() => faker.date.future().toISOString(), { probability: 0.3 }),
		sentAt: faker.date.recent({ days: 30 }).toISOString(),
		status: faker.helpers.arrayElement(deliveryStatuses),
		stats: {
			sentCount,
			deliveredCount,
			openedCount,
			failedCount: sentCount - deliveredCount,
			openRate: +((openedCount / deliveredCount) * 100).toFixed(1),
			deliveryRate: +((deliveredCount / sentCount) * 100).toFixed(1),
		},
	};
};

const notificationHistory = Array.from({ length: 50 }).map(() => generateNotification());

export const sendNotification = http.post(`/api${NotificationApi.Send}`, async ({ request }) => {
	const body = (await request.json()) as Record<string, unknown>;
	
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Notification sent successfully",
		data: {
			id: faker.string.uuid(),
			...body,
			sentAt: new Date().toISOString(),
			status: "sent",
		},
	});
});

export const getNotificationHistory = http.get(`/api${NotificationApi.History}`, ({ request }) => {
	const url = new URL(request.url);
	const page = Number.parseInt(url.searchParams.get("page") || "1");
	const limit = Number.parseInt(url.searchParams.get("limit") || "10");
	const recipientType = url.searchParams.get("recipientType");

	let filtered = [...notificationHistory];

	if (recipientType && recipientType !== "all") {
		filtered = filtered.filter((n) => n.recipientType === recipientType);
	}

	filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

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

export const getNotificationDetails = http.get(`/api/notifications/:id`, ({ params }) => {
	const { id } = params;
	const notification = notificationHistory.find((n) => n.id === id);

	if (!notification) {
		return HttpResponse.json(
			{ status: ResultStatus.ERROR, message: "Notification not found" },
			{ status: 404 }
		);
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: notification,
	});
});

export const notificationHandlers = [
	sendNotification,
	getNotificationHistory,
	getNotificationDetails,
];
