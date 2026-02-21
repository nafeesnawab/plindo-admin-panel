import apiClient from "../apiClient";

export enum CarsApi {
	List = "/admin/cars",
	Makes = "/admin/cars/makes",
	BodyTypes = "/admin/cars/body-types",
	Grouped = "/admin/cars/grouped",
}

export interface Car {
	id: string;
	make: string;
	model: string;
	bodyType: string;
	createdAt: string;
	updatedAt: string;
}

export type CarFormData = Omit<Car, "id" | "createdAt" | "updatedAt">;

export interface CarsResponse {
	cars: Car[];
}

export interface MakesResponse {
	makes: string[];
}

export interface BodyTypesResponse {
	bodyTypes: string[];
}

export interface GroupedCarsResponse {
	carsGrouped: Record<string, Car[]>;
}

export interface ModelsResponse {
	models: string[];
}

export interface CarFilters {
	make?: string;
	model?: string;
	bodyType?: string;
	search?: string;
}

const getCars = (params?: CarFilters) =>
	apiClient.get<CarsResponse>({ url: CarsApi.List, params });

const getCarById = (id: string) =>
	apiClient.get<{ car: Car }>({ url: `${CarsApi.List}/${id}` });

const createCar = (data: CarFormData) =>
	apiClient.post<{ car: Car }>({ url: CarsApi.List, data });

const updateCar = (id: string, data: Partial<CarFormData>) =>
	apiClient.put<{ car: Car }>({ url: `${CarsApi.List}/${id}`, data });

const deleteCar = (id: string) =>
	apiClient.delete({ url: `${CarsApi.List}/${id}` });

const getMakes = () =>
	apiClient.get<MakesResponse>({ url: CarsApi.Makes });

const getBodyTypes = () =>
	apiClient.get<BodyTypesResponse>({ url: CarsApi.BodyTypes });

const getGrouped = () =>
	apiClient.get<GroupedCarsResponse>({ url: CarsApi.Grouped });

const getModelsByMake = (make: string) =>
	apiClient.get<ModelsResponse>({ url: `${CarsApi.List}/models/${encodeURIComponent(make)}` });

export default {
	getCars,
	getCarById,
	createCar,
	updateCar,
	deleteCar,
	getMakes,
	getBodyTypes,
	getGrouped,
	getModelsByMake,
};
