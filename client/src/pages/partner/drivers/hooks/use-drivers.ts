import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

import apiClient from "@/api/apiClient";
import driversService from "@/api/services/driversService";

import type { Driver, DriverFormData } from "../types";
import { EMPTY_FORM } from "../types";

export function useDrivers({
	searchTerm,
	statusFilter,
}: {
	searchTerm: string;
	statusFilter: string;
}) {
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["partner-drivers", searchTerm, statusFilter],
		queryFn: () =>
			driversService.getDrivers({
				search: searchTerm || undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
			}),
	});

	const drivers: Driver[] = (data?.drivers ?? []) as Driver[];

	const createMutation = useMutation({
		mutationFn: (formData: DriverFormData) =>
			driversService.createDriver(formData),
		onSuccess: () => {
			toast.success("Driver added successfully");
			queryClient.invalidateQueries({ queryKey: ["partner-drivers"] });
		},
		onError: () => toast.error("Failed to add driver"),
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			data: formData,
		}: {
			id: string;
			data: Partial<DriverFormData>;
		}) => driversService.updateDriver(id, formData),
		onSuccess: () => {
			toast.success("Driver updated successfully");
			queryClient.invalidateQueries({ queryKey: ["partner-drivers"] });
		},
		onError: () => toast.error("Failed to update driver"),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => driversService.deleteDriver(id),
		onSuccess: () => {
			toast.success("Driver deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["partner-drivers"] });
		},
		onError: () => toast.error("Failed to delete driver"),
	});

	const toggleMutation = useMutation({
		mutationFn: ({
			id,
			currentStatus,
		}: {
			id: string;
			currentStatus: string;
		}) =>
			driversService.updateDriver(id, {
				status: currentStatus === "active" ? "inactive" : "active",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["partner-drivers"] });
		},
		onError: () => toast.error("Failed to update driver status"),
	});

	const isSubmitting =
		createMutation.isPending ||
		updateMutation.isPending ||
		deleteMutation.isPending;

	const addDriver = async (formData: DriverFormData) => {
		try {
			await createMutation.mutateAsync(formData);
			return true;
		} catch {
			return false;
		}
	};

	const updateDriver = async (id: string, formData: DriverFormData) => {
		try {
			await updateMutation.mutateAsync({ id, data: formData });
			return true;
		} catch {
			return false;
		}
	};

	const deleteDriver = async (id: string) => {
		try {
			await deleteMutation.mutateAsync(id);
			return true;
		} catch {
			return false;
		}
	};

	const toggleStatus = (driver: Driver) => {
		toggleMutation.mutate({ id: driver.id, currentStatus: driver.status });
		toast.success(
			`Driver ${driver.status === "active" ? "deactivated" : "activated"}`,
		);
	};

	return {
		drivers,
		totalCount: drivers.length,
		isSubmitting,
		isLoading,
		addDriver,
		updateDriver,
		deleteDriver,
		toggleStatus,
	};
}

export function useDriverForm() {
	const [formData, setFormData] = useState<DriverFormData>(EMPTY_FORM);
	const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
	const [uploading, setUploading] = useState(false);
	const licenseInputRef = useRef<HTMLInputElement>(null);
	const insuranceInputRef = useRef<HTMLInputElement>(null);
	const photoInputRef = useRef<HTMLInputElement>(null);

	const isEditing = !!editingDriver;

	const uploadFile = async (file: File): Promise<string> => {
		const body = new FormData();
		body.append("file", file);
		const data = await apiClient.postForm<{ url: string }>({
			url: "/upload",
			data: body,
		});
		return data.url;
	};

	const openForm = (driver?: Driver) => {
		if (driver) {
			setEditingDriver(driver);
			setFormData({
				fullName: driver.fullName,
				phone: driver.phone,
				email: driver.email,
				licenseNumber: driver.licenseNumber,
				licenseUrl: driver.licenseUrl,
				licenseExpiry: driver.licenseExpiry,
				insuranceUrl: driver.insuranceUrl,
				insuranceExpiry: driver.insuranceExpiry,
				photoUrl: driver.photoUrl,
				status: driver.status,
			});
		} else {
			setEditingDriver(null);
			setFormData(EMPTY_FORM);
		}
	};

	const resetForm = () => {
		setEditingDriver(null);
		setFormData(EMPTY_FORM);
	};

	const validate = () => {
		if (
			!formData.fullName ||
			!formData.phone ||
			!formData.email ||
			!formData.licenseNumber
		) {
			toast.error("Please fill in all required fields");
			return false;
		}
		return true;
	};

	const handleLicenseUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";
		setUploading(true);
		try {
			const url = await uploadFile(file);
			setFormData((prev) => ({ ...prev, licenseUrl: url }));
			toast.success("License document uploaded");
		} catch {
			toast.error("Failed to upload license document");
		} finally {
			setUploading(false);
		}
	};

	const handleInsuranceUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";
		setUploading(true);
		try {
			const url = await uploadFile(file);
			setFormData((prev) => ({ ...prev, insuranceUrl: url }));
			toast.success("Insurance document uploaded");
		} catch {
			toast.error("Failed to upload insurance document");
		} finally {
			setUploading(false);
		}
	};

	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";
		setUploading(true);
		try {
			const url = await uploadFile(file);
			setFormData((prev) => ({ ...prev, photoUrl: url }));
			toast.success("Photo uploaded");
		} catch {
			toast.error("Failed to upload photo");
		} finally {
			setUploading(false);
		}
	};

	return {
		formData,
		setFormData,
		editingDriver,
		isEditing,
		uploading,
		openForm,
		resetForm,
		validate,
		licenseInputRef,
		insuranceInputRef,
		photoInputRef,
		handleLicenseUpload,
		handleInsuranceUpload,
		handlePhotoUpload,
	};
}
