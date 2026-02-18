import { useState } from "react";
import { toast } from "sonner";
import { CAR_BODY_TYPES } from "@/_mock/handlers/_cars";

import type { AdminCar, CarOverride, DistanceCharges, Service } from "../types";
import { getInitialDistanceCharges } from "../types";

export function usePricingForm(adminCars: AdminCar[]) {
	const [service, setService] = useState<Service | null>(null);
	const [bodyTypePricing, setBodyTypePricing] = useState<{ bodyType: string; price: number }[]>([]);
	const [carOverrides, setCarOverrides] = useState<CarOverride[]>([]);
	const [distanceCharges, setDistanceCharges] = useState<DistanceCharges | undefined>();

	const [overrideMake, setOverrideMake] = useState("");
	const [overrideModel, setOverrideModel] = useState("");
	const [overridePrice, setOverridePrice] = useState(0);

	const uniqueMakes = [...new Set(adminCars.map((car) => car.make))].sort();
	const modelsForMake = overrideMake ? adminCars.filter((car) => car.make === overrideMake) : [];

	const loadService = (svc: Service) => {
		setService(svc);
		const merged = CAR_BODY_TYPES.map((bt) => {
			const existing = svc.bodyTypePricing.find((bp) => bp.bodyType === bt);
			return existing ?? { bodyType: bt, price: 0 };
		});
		setBodyTypePricing(merged);
		setCarOverrides(svc.carOverrides);
		setDistanceCharges(svc.distanceCharges);
	};

	const reset = () => {
		setService(null);
		setBodyTypePricing([]);
		setCarOverrides([]);
		setDistanceCharges(undefined);
		setOverrideMake("");
		setOverrideModel("");
		setOverridePrice(0);
	};

	const updateBodyTypePrice = (bodyType: string, price: number) => {
		setBodyTypePricing((prev) => prev.map((bp) => (bp.bodyType === bodyType ? { ...bp, price } : bp)));
	};

	const addCarOverride = (): boolean => {
		if (!overrideMake || !overrideModel || overridePrice <= 0) {
			toast.error("Please select make, model and enter a valid price");
			return false;
		}
		const car = adminCars.find((c) => c.make === overrideMake && c.model === overrideModel);
		if (!car) return false;
		if (carOverrides.some((co) => co.make === overrideMake && co.model === overrideModel)) {
			toast.error("This car already has a custom price");
			return false;
		}
		const newOverride: CarOverride = {
			carId: car.id,
			make: car.make,
			model: car.model,
			bodyType: car.bodyType,
			price: overridePrice,
		};
		setCarOverrides((prev) => [...prev, newOverride]);
		setOverrideMake("");
		setOverrideModel("");
		setOverridePrice(0);
		return true;
	};

	const removeCarOverride = (carId: string) => {
		setCarOverrides((prev) => prev.filter((co) => co.carId !== carId));
	};

	const updateCarOverridePrice = (carId: string, price: number) => {
		setCarOverrides((prev) => prev.map((co) => (co.carId === carId ? { ...co, price } : co)));
	};

	const updateDistanceCharge = (key: keyof DistanceCharges, value: number) => {
		setDistanceCharges((prev) => ({
			...getInitialDistanceCharges(),
			...prev,
			[key]: value,
		}));
	};

	const getBodyTypeDefaultPrice = (bodyType: string): number => {
		const entry = bodyTypePricing.find((bp) => bp.bodyType === bodyType);
		return entry?.price ?? 0;
	};

	const getPricingPayload = () => ({
		bodyTypePricing,
		carOverrides,
		distanceCharges: service?.serviceType === "pick_by_me" ? distanceCharges : undefined,
	});

	const validate = () => {
		const hasZeroPrice = bodyTypePricing.some((bp) => bp.price <= 0);
		if (hasZeroPrice) {
			toast.error("All body type prices must be greater than 0");
			return false;
		}
		return true;
	};

	return {
		service,
		bodyTypePricing,
		carOverrides,
		distanceCharges,
		overrideMake,
		setOverrideMake,
		overrideModel,
		setOverrideModel,
		overridePrice,
		setOverridePrice,
		uniqueMakes,
		modelsForMake,
		loadService,
		reset,
		updateBodyTypePrice,
		addCarOverride,
		removeCarOverride,
		updateCarOverridePrice,
		updateDistanceCharge,
		getBodyTypeDefaultPrice,
		getPricingPayload,
		validate,
	};
}
