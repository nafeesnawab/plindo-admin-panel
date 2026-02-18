import { Building2, MapPin, Truck } from "lucide-react";
import { createElement } from "react";

import type { ServiceCategory } from "@/types/booking";

export type ServiceType = "book_me" | "pick_by_me" | "washing_van";

export interface BodyTypePricing {
	bodyType: string;
	price: number;
}

export interface CarOverride {
	carId: string;
	make: string;
	model: string;
	bodyType: string;
	price: number;
}

export interface DistanceCharges {
	"0-1km": number;
	"1-2km": number;
	"2-3km": number;
}

export interface AdminCar {
	id: string;
	make: string;
	model: string;
	bodyType: string;
}

export interface Service {
	id: string;
	name: string;
	description: string;
	serviceCategory: ServiceCategory;
	serviceType: ServiceType;
	duration: number;
	bannerUrl?: string;
	bodyTypePricing: BodyTypePricing[];
	carOverrides: CarOverride[];
	distanceCharges?: DistanceCharges;
	status: "active" | "inactive";
	createdAt: string;
}

export type ServiceFormData = Omit<Service, "id" | "createdAt">;

export const SERVICE_TYPE_CONFIG: Record<
	ServiceType,
	{ label: string; icon: React.ReactNode; color: string; darkColor: string }
> = {
	book_me: {
		label: "Book Me",
		icon: createElement(Building2, { className: "h-4 w-4" }),
		color: "bg-blue-50 text-blue-700 border-blue-200",
		darkColor: "dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
	},
	pick_by_me: {
		label: "Pick By Me",
		icon: createElement(Truck, { className: "h-4 w-4" }),
		color: "bg-purple-50 text-purple-700 border-purple-200",
		darkColor: "dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
	},
	washing_van: {
		label: "Washing Van",
		icon: createElement(MapPin, { className: "h-4 w-4" }),
		color: "bg-amber-50 text-amber-700 border-amber-200",
		darkColor: "dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
	},
};

export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50] as const;

export const getInitialDistanceCharges = (): DistanceCharges => ({
	"0-1km": 3,
	"1-2km": 5,
	"2-3km": 8,
});

export const getInitialFormState = (bodyTypes: string[] = []): ServiceFormData => ({
	name: "",
	description: "",
	serviceCategory: "wash",
	serviceType: "book_me",
	duration: 30,
	bannerUrl: "",
	bodyTypePricing: bodyTypes.map((bt) => ({ bodyType: bt, price: 0 })),
	carOverrides: [],
	status: "active",
});

export const getBasePrice = (service: Service) => {
	if (service.bodyTypePricing.length === 0) return "N/A";
	const prices = service.bodyTypePricing.map((bp) => bp.price).filter((p) => p > 0);
	if (prices.length === 0) return "N/A";
	const min = Math.min(...prices);
	const max = Math.max(...prices);
	return min === max ? `\u00A3${min}` : `\u00A3${min} - \u00A3${max}`;
};

export const formatDuration = (minutes: number) => {
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};
