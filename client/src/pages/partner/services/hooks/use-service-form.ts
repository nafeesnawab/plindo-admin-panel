import { useRef, useState } from "react";
import { toast } from "sonner";
import { CAR_BODY_TYPES } from "@/_mock/handlers/_cars";
import type { ServiceCategory } from "@/types/booking";

import type { Service, ServiceFormData, ServiceType } from "../types";
import { getInitialDistanceCharges, getInitialFormState } from "../types";

export interface ServiceBasicsData {
	name: string;
	description: string;
	serviceCategory: ServiceCategory;
	serviceType: ServiceType;
	duration: number;
	bannerUrl?: string;
	status: "active" | "inactive";
}

export function useServiceForm() {
	const [formData, setFormData] = useState<ServiceBasicsData>({
		name: "",
		description: "",
		serviceCategory: "wash",
		serviceType: "book_me",
		duration: 30,
		bannerUrl: "",
		status: "active",
	});
	const [isEditing, setIsEditing] = useState(false);
	const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
	const [bannerPreview, setBannerPreview] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const resetForm = () => {
		setIsEditing(false);
		setEditingServiceId(null);
		setFormData({
			name: "",
			description: "",
			serviceCategory: "wash",
			serviceType: "book_me",
			duration: 30,
			bannerUrl: "",
			status: "active",
		});
		setBannerPreview("");
	};

	const loadService = (service: Service) => {
		setIsEditing(true);
		setEditingServiceId(service.id);
		setFormData({
			name: service.name,
			description: service.description,
			serviceCategory: service.serviceCategory,
			serviceType: service.serviceType,
			duration: service.duration,
			bannerUrl: service.bannerUrl || "",
			status: service.status,
		});
		setBannerPreview(service.bannerUrl || "");
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please upload an image file");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image size should be less than 5MB");
			return;
		}
		const reader = new FileReader();
		reader.onloadend = () => {
			const result = reader.result as string;
			setBannerPreview(result);
			setFormData((prev) => ({ ...prev, bannerUrl: result }));
		};
		reader.readAsDataURL(file);
	};

	const removeBanner = () => {
		setBannerPreview("");
		setFormData((prev) => ({ ...prev, bannerUrl: "" }));
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const getPayload = (existingService?: Service): ServiceFormData => {
		const base = existingService
			? {
					bodyTypePricing: existingService.bodyTypePricing,
					carOverrides: existingService.carOverrides,
					distanceCharges: existingService.distanceCharges,
				}
			: {
					bodyTypePricing: getInitialFormState(CAR_BODY_TYPES).bodyTypePricing,
					carOverrides: [],
					distanceCharges: formData.serviceType === "pick_by_me" ? getInitialDistanceCharges() : undefined,
				};

		return {
			...formData,
			bannerUrl: bannerPreview || formData.bannerUrl,
			...base,
		};
	};

	const validate = () => {
		if (!formData.name.trim()) {
			toast.error("Please enter a service name");
			return false;
		}
		if (!formData.serviceCategory || !formData.serviceType) {
			toast.error("Please select a category and type");
			return false;
		}
		if (formData.duration < 5) {
			toast.error("Duration must be at least 5 minutes");
			return false;
		}
		return true;
	};

	return {
		formData,
		setFormData,
		isEditing,
		editingServiceId,
		bannerPreview,
		fileInputRef,
		resetForm,
		loadService,
		handleFileUpload,
		removeBanner,
		getPayload,
		validate,
	};
}
