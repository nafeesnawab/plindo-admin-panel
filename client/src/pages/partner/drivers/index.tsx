import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/ui/button";

import { DeleteDialog } from "./components/delete-dialog";
import { DriverFormDialog } from "./components/driver-form-dialog";
import { DriversTable } from "./components/drivers-table";
import { DriversToolbar } from "./components/drivers-toolbar";
import { useDriverForm, useDrivers } from "./hooks/use-drivers";
import type { Driver } from "./types";

export default function PartnerDriversPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [showFilters, setShowFilters] = useState(false);
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

	const { drivers, totalCount, isSubmitting, addDriver, updateDriver, deleteDriver, toggleStatus } = useDrivers({
		searchTerm,
		statusFilter,
	});

	const form = useDriverForm();

	const activeFiltersCount = [statusFilter !== "all"].filter(Boolean).length;

	const handleCreateNew = () => {
		form.openForm();
		setFormDialogOpen(true);
	};

	const handleEdit = (driver: Driver) => {
		form.openForm(driver);
		setFormDialogOpen(true);
	};

	const handleFormSave = async () => {
		if (!form.validate()) return;
		let success: boolean;
		if (form.editingDriver) {
			success = await updateDriver(form.editingDriver.id, form.formData);
		} else {
			success = await addDriver(form.formData);
		}
		if (success) {
			setFormDialogOpen(false);
			form.resetForm();
		}
	};

	const handleDeleteClick = (driver: Driver) => {
		setDriverToDelete(driver);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!driverToDelete) return;
		const success = await deleteDriver(driverToDelete.id);
		if (success) {
			setDeleteDialogOpen(false);
			setDriverToDelete(null);
		}
	};

	const clearFilters = () => {
		setStatusFilter("all");
		setSearchTerm("");
	};

	return (
		<div className="flex flex-col gap-4 h-full">
			<div className="flex items-center gap-2 flex-wrap">
				<DriversToolbar
					searchQuery={searchTerm}
					onSearchChange={setSearchTerm}
					filterStatus={statusFilter}
					onStatusChange={setStatusFilter}
					showFilters={showFilters}
					onToggleFilters={() => setShowFilters(!showFilters)}
					activeFiltersCount={activeFiltersCount}
					onClearFilters={clearFilters}
				/>
				<Button onClick={handleCreateNew} size="sm" className="gap-1.5 h-9 shrink-0">
					<Plus className="h-3.5 w-3.5" />
					Add Driver
				</Button>
			</div>

			<DriversTable
				drivers={drivers}
				totalCount={totalCount}
				loading={false}
				onEdit={handleEdit}
				onToggleStatus={toggleStatus}
				onDelete={handleDeleteClick}
			/>

			<DriverFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				formData={form.formData}
				setFormData={form.setFormData}
				isEditing={form.isEditing}
				licenseInputRef={form.licenseInputRef}
				insuranceInputRef={form.insuranceInputRef}
				photoInputRef={form.photoInputRef}
				onLicenseUpload={form.handleLicenseUpload}
				onInsuranceUpload={form.handleInsuranceUpload}
				onPhotoUpload={form.handlePhotoUpload}
				onSave={handleFormSave}
				isPending={isSubmitting}
			/>

			<DeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				driverName={driverToDelete?.fullName ?? ""}
				onConfirm={handleDeleteConfirm}
				isPending={isSubmitting}
			/>
		</div>
	);
}
