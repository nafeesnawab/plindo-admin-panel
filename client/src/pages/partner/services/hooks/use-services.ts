import { useEffect, useState } from "react";
import { toast } from "sonner";

import apiClient from "@/api/apiClient";
import partnerServicesService from "@/api/services/partnerServicesService";

import type { AdminCar, Service } from "../types";

export function useServices() {
	const [services, setServices] = useState<Service[]>([]);
	const [adminCars, setAdminCars] = useState<AdminCar[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const [servicesData, carsData] = await Promise.all([
					partnerServicesService.getAll(),
					apiClient.get<{ cars: AdminCar[] }>({ url: "/admin/cars" }),
				]);
				setServices(servicesData.services as unknown as Service[]);
				setAdminCars(carsData.cars);
			} catch {
				toast.error("Failed to fetch data");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const duplicateService = async (service: Service) => {
		try {
			const data = await partnerServicesService.duplicate(service.id);
			setServices((prev) => [...prev, data.service as unknown as Service]);
			toast.success("Service duplicated");
		} catch {
			toast.error("Failed to duplicate service");
		}
	};

	const toggleStatus = async (serviceId: string) => {
		try {
			const data = await partnerServicesService.toggleStatus(serviceId);
			setServices((prev) => prev.map((s) => (s.id === serviceId ? (data.service as unknown as Service) : s)));
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const deleteService = async (serviceId: string) => {
		try {
			await partnerServicesService.delete(serviceId);
			setServices((prev) => prev.filter((s) => s.id !== serviceId));
			toast.success("Service deleted");
			return true;
		} catch {
			toast.error("Failed to delete");
		}
		return false;
	};

	const saveService = async (payload: Record<string, unknown>, editingId?: string) => {
		try {
			if (editingId) {
				const data = await partnerServicesService.update(editingId, payload as any);
				setServices((prev) => prev.map((s) => (s.id === editingId ? (data.service as unknown as Service) : s)));
				toast.success("Service updated");
				return true;
			}
			const data = await partnerServicesService.create(payload as any);
			setServices((prev) => [...prev, data.service as unknown as Service]);
			toast.success("Service created");
			return true;
		} catch {
			toast.error("An error occurred");
		}
		return false;
	};

	const stats = {
		total: services.length,
		active: services.filter((s) => s.status === "active").length,
		inactive: services.filter((s) => s.status === "inactive").length,
	};

	return {
		services,
		adminCars,
		loading,
		stats,
		duplicateService,
		toggleStatus,
		deleteService,
		saveService,
	};
}
