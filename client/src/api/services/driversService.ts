import apiClient from "../apiClient";

export enum DriversApi {
	List = "/partner/drivers",
	Active = "/partner/drivers/active",
	Expiring = "/partner/drivers/expiring",
}

export interface Driver {
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

export type DriverFormData = Omit<Driver, "id" | "createdAt">;

export interface DriversResponse {
	drivers: Driver[];
}

export interface ExpiringDriversResponse {
	drivers: Driver[];
	count: number;
}

export interface DriverFilters {
	status?: string;
	search?: string;
}

const getDrivers = (params?: DriverFilters) =>
	apiClient.get<DriversResponse>({ url: DriversApi.List, params });

const getActiveDrivers = () =>
	apiClient.get<DriversResponse>({ url: DriversApi.Active });

const getExpiringDrivers = (days?: number) =>
	apiClient.get<ExpiringDriversResponse>({ url: DriversApi.Expiring, params: { days } });

const getDriver = (id: string) =>
	apiClient.get<{ driver: Driver }>({ url: `${DriversApi.List}/${id}` });

const createDriver = (data: DriverFormData) =>
	apiClient.post<{ driver: Driver }>({ url: DriversApi.List, data });

const updateDriver = (id: string, data: Partial<DriverFormData>) =>
	apiClient.put<{ driver: Driver }>({ url: `${DriversApi.List}/${id}`, data });

const deleteDriver = (id: string) =>
	apiClient.delete({ url: `${DriversApi.List}/${id}` });

export default {
	getDrivers,
	getActiveDrivers,
	getExpiringDrivers,
	getDriver,
	createDriver,
	updateDriver,
	deleteDriver,
};
