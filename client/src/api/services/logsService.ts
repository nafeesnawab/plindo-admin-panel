import apiClient from "../apiClient";

enum LogsApi {
	ActivityLogs = "/logs/activity",
	SystemErrors = "/logs/errors",
	PaymentFailures = "/logs/payments",
	ApiErrors = "/logs/api",
}

export interface ActivityLog {
	id: string;
	adminId: string;
	adminName: string;
	action: string;
	targetType: string;
	targetId: string;
	details: string;
	ipAddress: string;
	timestamp: string;
}

export interface SystemError {
	id: string;
	level: "error" | "warning" | "critical";
	message: string;
	stack: string;
	source: string;
	resolved: boolean;
	timestamp: string;
}

export interface PaymentFailure {
	id: string;
	transactionId: string;
	userId: string;
	userName: string;
	amount: number;
	currency: string;
	errorCode: string;
	errorMessage: string;
	retryCount: number;
	resolved: boolean;
	timestamp: string;
}

export interface ApiError {
	id: string;
	endpoint: string;
	method: string;
	statusCode: number;
	errorMessage: string;
	requestId: string;
	userId: string | null;
	responseTime: number;
	timestamp: string;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ActivityLogsResponse {
	logs: ActivityLog[];
	admins: string[];
	pagination: Pagination;
}

export interface SystemErrorsResponse {
	errors: SystemError[];
	pagination: Pagination;
}

export interface PaymentFailuresResponse {
	failures: PaymentFailure[];
	pagination: Pagination;
}

export interface ApiErrorsResponse {
	errors: ApiError[];
	pagination: Pagination;
}

interface LogFilters {
	page?: number;
	limit?: number;
	admin?: string;
	level?: string;
}

const logsService = {
	getActivityLogs: (filters: LogFilters = {}) =>
		apiClient.get<ActivityLogsResponse>({ url: LogsApi.ActivityLogs, params: filters }),

	getSystemErrors: (filters: LogFilters = {}) =>
		apiClient.get<SystemErrorsResponse>({ url: LogsApi.SystemErrors, params: filters }),

	getPaymentFailures: (filters: LogFilters = {}) =>
		apiClient.get<PaymentFailuresResponse>({ url: LogsApi.PaymentFailures, params: filters }),

	getApiErrors: (filters: LogFilters = {}) =>
		apiClient.get<ApiErrorsResponse>({ url: LogsApi.ApiErrors, params: filters }),
};

export default logsService;
