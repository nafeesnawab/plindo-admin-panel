import { useRef, useState } from "react";
import { toast } from "sonner";

import type { Driver, DriverFormData } from "../types";
import { EMPTY_FORM, MOCK_DRIVERS } from "../types";

export function useDrivers({ searchTerm, statusFilter }: { searchTerm: string; statusFilter: string }) {
	const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const filteredDrivers = drivers.filter((driver) => {
		if (statusFilter !== "all" && driver.status !== statusFilter) return false;
		if (searchTerm) {
			const query = searchTerm.toLowerCase();
			return (
				driver.fullName.toLowerCase().includes(query) ||
				driver.phone.includes(query) ||
				driver.email.toLowerCase().includes(query) ||
				driver.licenseNumber.toLowerCase().includes(query)
			);
		}
		return true;
	});

	const addDriver = async (formData: DriverFormData) => {
		setIsSubmitting(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		const newDriver: Driver = {
			...formData,
			id: `d-${Date.now()}`,
			createdAt: new Date().toISOString(),
		};
		setDrivers((prev) => [newDriver, ...prev]);
		toast.success("Driver added successfully");
		setIsSubmitting(false);
		return true;
	};

	const updateDriver = async (id: string, formData: DriverFormData) => {
		setIsSubmitting(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...formData } : d)));
		toast.success("Driver updated successfully");
		setIsSubmitting(false);
		return true;
	};

	const deleteDriver = async (id: string) => {
		setIsSubmitting(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		setDrivers((prev) => prev.filter((d) => d.id !== id));
		toast.success("Driver deleted successfully");
		setIsSubmitting(false);
		return true;
	};

	const toggleStatus = (driver: Driver) => {
		const newStatus = driver.status === "active" ? "inactive" : "active";
		setDrivers((prev) => prev.map((d) => (d.id === driver.id ? { ...d, status: newStatus } : d)));
		toast.success(`Driver ${newStatus === "active" ? "activated" : "deactivated"}`);
	};

	return {
		drivers: filteredDrivers,
		totalCount: drivers.length,
		isSubmitting,
		addDriver,
		updateDriver,
		deleteDriver,
		toggleStatus,
	};
}

export function useDriverForm() {
	const [formData, setFormData] = useState<DriverFormData>(EMPTY_FORM);
	const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
	const licenseInputRef = useRef<HTMLInputElement>(null);
	const insuranceInputRef = useRef<HTMLInputElement>(null);
	const photoInputRef = useRef<HTMLInputElement>(null);

	const isEditing = !!editingDriver;

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
		if (!formData.fullName || !formData.phone || !formData.email || !formData.licenseNumber) {
			toast.error("Please fill in all required fields");
			return false;
		}
		return true;
	};

	const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setFormData((prev) => ({ ...prev, licenseUrl: file.name }));
			toast.success(`License document "${file.name}" selected`);
			e.target.value = "";
		}
	};

	const handleInsuranceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setFormData((prev) => ({ ...prev, insuranceUrl: file.name }));
			toast.success(`Insurance document "${file.name}" selected`);
			e.target.value = "";
		}
	};

	const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setFormData((prev) => ({ ...prev, photoUrl: url }));
			e.target.value = "";
		}
	};

	return {
		formData,
		setFormData,
		editingDriver,
		isEditing,
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
