import { faker } from "@faker-js/faker";
import { HttpResponse, http } from "msw";

import { ResultStatus } from "@/types/enum";

enum LogsApi {
	ActivityLogs = "/logs/activity",
	SystemErrors = "/logs/errors",
	PaymentFailures = "/logs/payments",
	ApiErrors = "/logs/api",
}

const adminNames = ["Admin User", "John Smith", "Sarah Johnson", "Mike Wilson"];

const generateActivityLog = () => ({
	id: faker.string.uuid(),
	adminId: faker.string.uuid(),
	adminName: faker.helpers.arrayElement(adminNames),
	action: faker.helpers.arrayElement([
		"Approved partner application",
		"Suspended partner account",
		"Issued refund",
		"Updated commission settings",
		"Resolved dispute",
		"Closed support ticket",
		"Updated subscription plan",
		"Modified booking rules",
		"Published terms & conditions",
		"Deleted FAQ entry",
	]),
	targetType: faker.helpers.arrayElement(["partner", "customer", "booking", "settings", "content"]),
	targetId: faker.string.uuid(),
	details: faker.lorem.sentence(),
	ipAddress: faker.internet.ip(),
	timestamp: faker.date.recent({ days: 7 }).toISOString(),
});

const generateSystemError = () => ({
	id: faker.string.uuid(),
	level: faker.helpers.arrayElement(["error", "warning", "critical"]),
	message: faker.helpers.arrayElement([
		"Database connection timeout",
		"Memory usage exceeded threshold",
		"Failed to process scheduled job",
		"Cache invalidation error",
		"File upload service unavailable",
		"Email service connection failed",
		"Push notification service error",
	]),
	stack: `Error: ${faker.lorem.sentence()}\n    at Function.Module (internal/modules/cjs/loader.js:889:14)\n    at Module._compile (internal/modules/cjs/loader.js:995:10)`,
	source: faker.helpers.arrayElement(["api-server", "worker", "scheduler", "notification-service"]),
	resolved: faker.datatype.boolean({ probability: 0.3 }),
	timestamp: faker.date.recent({ days: 3 }).toISOString(),
});

const generatePaymentFailure = () => ({
	id: faker.string.uuid(),
	transactionId: `txn_${faker.string.alphanumeric(24)}`,
	userId: faker.string.uuid(),
	userName: faker.person.fullName(),
	amount: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
	currency: "EUR",
	errorCode: faker.helpers.arrayElement([
		"card_declined",
		"insufficient_funds",
		"expired_card",
		"processing_error",
		"authentication_required",
		"invalid_card",
	]),
	errorMessage: faker.helpers.arrayElement([
		"Your card was declined",
		"Insufficient funds in account",
		"Card has expired",
		"Payment processing error",
		"3D Secure authentication required",
		"Invalid card number",
	]),
	retryCount: faker.number.int({ min: 0, max: 3 }),
	resolved: faker.datatype.boolean({ probability: 0.4 }),
	timestamp: faker.date.recent({ days: 7 }).toISOString(),
});

const generateApiError = () => ({
	id: faker.string.uuid(),
	endpoint: faker.helpers.arrayElement([
		"POST /api/bookings",
		"GET /api/partners/:id",
		"PUT /api/settings/commission",
		"POST /api/payments/process",
		"GET /api/analytics/users",
	]),
	method: faker.helpers.arrayElement(["GET", "POST", "PUT", "DELETE"]),
	statusCode: faker.helpers.arrayElement([400, 401, 403, 404, 500, 502, 503]),
	errorMessage: faker.lorem.sentence(),
	requestId: faker.string.uuid(),
	userId: faker.datatype.boolean() ? faker.string.uuid() : null,
	responseTime: faker.number.int({ min: 100, max: 5000 }),
	timestamp: faker.date.recent({ days: 3 }).toISOString(),
});

const activityLogs = Array.from({ length: 50 }, generateActivityLog);
const systemErrors = Array.from({ length: 30 }, generateSystemError);
const paymentFailures = Array.from({ length: 20 }, generatePaymentFailure);
const apiErrors = Array.from({ length: 40 }, generateApiError);

const getActivityLogs = http.get(`/api${LogsApi.ActivityLogs}`, ({ request }) => {
	const url = new URL(request.url);
	const page = Number(url.searchParams.get("page")) || 1;
	const limit = Number(url.searchParams.get("limit")) || 20;
	const adminName = url.searchParams.get("admin");

	let filtered = [...activityLogs];
	if (adminName && adminName !== "all") {
		filtered = filtered.filter((l) => l.adminName === adminName);
	}

	filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	const total = filtered.length;
	const start = (page - 1) * limit;
	const paginated = filtered.slice(start, start + limit);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			logs: paginated,
			admins: adminNames,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		},
	});
});

const getSystemErrors = http.get(`/api${LogsApi.SystemErrors}`, ({ request }) => {
	const url = new URL(request.url);
	const page = Number(url.searchParams.get("page")) || 1;
	const limit = Number(url.searchParams.get("limit")) || 20;
	const level = url.searchParams.get("level");

	let filtered = [...systemErrors];
	if (level && level !== "all") {
		filtered = filtered.filter((e) => e.level === level);
	}

	filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	const total = filtered.length;
	const start = (page - 1) * limit;
	const paginated = filtered.slice(start, start + limit);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: { errors: paginated, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
	});
});

const getPaymentFailures = http.get(`/api${LogsApi.PaymentFailures}`, ({ request }) => {
	const url = new URL(request.url);
	const page = Number(url.searchParams.get("page")) || 1;
	const limit = Number(url.searchParams.get("limit")) || 20;

	const sorted = [...paymentFailures].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	const total = sorted.length;
	const start = (page - 1) * limit;
	const paginated = sorted.slice(start, start + limit);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: { failures: paginated, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
	});
});

const getApiErrors = http.get(`/api${LogsApi.ApiErrors}`, ({ request }) => {
	const url = new URL(request.url);
	const page = Number(url.searchParams.get("page")) || 1;
	const limit = Number(url.searchParams.get("limit")) || 20;

	const sorted = [...apiErrors].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	const total = sorted.length;
	const start = (page - 1) * limit;
	const paginated = sorted.slice(start, start + limit);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: { errors: paginated, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
	});
});

export const logsHandlers = [getActivityLogs, getSystemErrors, getPaymentFailures, getApiErrors];
