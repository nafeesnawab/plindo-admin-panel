import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SERVICE_CATEGORY_LABELS } from "@/types/booking";
import { Button } from "@/ui/button";

import { CarOverrideDialog } from "./components/car-pricing-dialog";
import { DeleteDialog } from "./components/delete-dialog";
import { ServiceFormDialog } from "./components/service-form-dialog";
import { ServicePricingPanel } from "./components/service-pricing-panel";
import { ServicesTable } from "./components/services-table";
import { ServicesToolbar } from "./components/services-toolbar";
import { usePricingForm } from "./hooks/use-pricing-form";
import { useServiceForm } from "./hooks/use-service-form";
import { useServices } from "./hooks/use-services";
import type { Service } from "./types";

type View = "list" | "pricing";

export default function PartnerServicesPage() {
	const { services, adminCars, loading, duplicateService, toggleStatus, deleteService, saveService } = useServices();
	const form = useServiceForm();
	const pricing = usePricingForm(adminCars);

	const [view, setView] = useState<View>("list");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterServiceType, setFilterServiceType] = useState("all");
	const [filterCategory, setFilterCategory] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const [showFilters, setShowFilters] = useState(false);
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [carOverrideDialogOpen, setCarOverrideDialogOpen] = useState(false);
	const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

	// ── Filtering ──
	const filteredServices = services.filter((service) => {
		const matchesSearch =
			searchQuery === "" ||
			service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(service.serviceCategory &&
				SERVICE_CATEGORY_LABELS[service.serviceCategory]?.toLowerCase().includes(searchQuery.toLowerCase()));
		const matchesType = filterServiceType === "all" || service.serviceType === filterServiceType;
		const matchesCategory = filterCategory === "all" || service.serviceCategory === filterCategory;
		const matchesStatus = filterStatus === "all" || service.status === filterStatus;
		return matchesSearch && matchesType && matchesCategory && matchesStatus;
	});

	const activeFiltersCount = [filterServiceType !== "all", filterCategory !== "all", filterStatus !== "all"].filter(
		Boolean,
	).length;

	// ── Service form handlers ──
	const handleCreateNew = () => {
		form.resetForm();
		setFormDialogOpen(true);
	};

	const handleEdit = (service: Service) => {
		form.loadService(service);
		setFormDialogOpen(true);
	};

	const handleFormSave = async () => {
		if (!form.validate()) return;
		const existingService = form.isEditing
			? (services.find((s) => s.id === form.editingServiceId) ?? undefined)
			: undefined;
		const payload = form.getPayload(existingService);
		const success = await saveService(payload as Record<string, unknown>, form.editingServiceId ?? undefined);
		if (success) {
			setFormDialogOpen(false);
			form.resetForm();
		}
	};

	// ── Pricing handlers ──
	const handleManagePricing = (service: Service) => {
		pricing.loadService(service);
		setView("pricing");
	};

	const handlePricingSave = async () => {
		if (!pricing.validate()) return;
		if (!pricing.service) return;
		const pricingPayload = pricing.getPricingPayload();
		const success = await saveService(pricingPayload as Record<string, unknown>, pricing.service.id);
		if (success) {
			toast.success("Pricing updated");
			pricing.reset();
			setView("list");
		}
	};

	const handlePricingBack = () => {
		pricing.reset();
		setView("list");
	};

	// ── Delete handlers ──
	const handleDeleteClick = (service: Service) => {
		setServiceToDelete(service);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!serviceToDelete) return;
		const success = await deleteService(serviceToDelete.id);
		if (success) {
			setDeleteDialogOpen(false);
			setServiceToDelete(null);
		}
	};

	const clearFilters = () => {
		setFilterServiceType("all");
		setFilterCategory("all");
		setFilterStatus("all");
		setSearchQuery("");
	};

	// ── Pricing view ──
	if (view === "pricing" && pricing.service) {
		return (
			<>
				<ServicePricingPanel
					service={pricing.service}
					bodyTypePricing={pricing.bodyTypePricing}
					carOverrides={pricing.carOverrides}
					distanceCharges={pricing.distanceCharges}
					onUpdateBodyTypePrice={pricing.updateBodyTypePrice}
					onRemoveCarOverride={pricing.removeCarOverride}
					onUpdateCarOverridePrice={pricing.updateCarOverridePrice}
					getBodyTypeDefaultPrice={pricing.getBodyTypeDefaultPrice}
					onOpenCarOverride={() => setCarOverrideDialogOpen(true)}
					onUpdateDistanceCharge={pricing.updateDistanceCharge}
					onSave={handlePricingSave}
					onBack={handlePricingBack}
				/>
				<CarOverrideDialog
					open={carOverrideDialogOpen}
					onOpenChange={setCarOverrideDialogOpen}
					selectedMake={pricing.overrideMake}
					onMakeChange={pricing.setOverrideMake}
					selectedModel={pricing.overrideModel}
					onModelChange={pricing.setOverrideModel}
					overridePrice={pricing.overridePrice}
					onPriceChange={pricing.setOverridePrice}
					uniqueMakes={pricing.uniqueMakes}
					modelsForMake={pricing.modelsForMake}
					getBodyTypeDefaultPrice={pricing.getBodyTypeDefaultPrice}
					onAdd={pricing.addCarOverride}
				/>
			</>
		);
	}

	// ── List view (default) ──
	return (
		<div className="flex flex-col gap-4 h-full">
			<div className="flex items-center gap-2 flex-wrap">
				<ServicesToolbar
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					filterServiceType={filterServiceType}
					onServiceTypeChange={setFilterServiceType}
					filterCategory={filterCategory}
					onCategoryChange={setFilterCategory}
					filterStatus={filterStatus}
					onStatusChange={setFilterStatus}
					showFilters={showFilters}
					onToggleFilters={() => setShowFilters(!showFilters)}
					activeFiltersCount={activeFiltersCount}
					onClearFilters={clearFilters}
				/>
				<Button onClick={handleCreateNew} size="sm" className="gap-1.5 h-9 shrink-0">
					<Plus className="h-3.5 w-3.5" />
					Add Service
				</Button>
			</div>

			<ServicesTable
				services={filteredServices}
				totalCount={services.length}
				loading={loading}
				onEdit={handleEdit}
				onManagePricing={handleManagePricing}
				onDuplicate={duplicateService}
				onToggleStatus={toggleStatus}
				onDelete={handleDeleteClick}
			/>

			{/* Service form dialog (basics only — no pricing) */}
			<ServiceFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				formData={form.formData}
				setFormData={form.setFormData}
				isEditing={form.isEditing}
				bannerPreview={form.bannerPreview}
				fileInputRef={form.fileInputRef}
				onFileUpload={form.handleFileUpload}
				onRemoveBanner={form.removeBanner}
				onSave={handleFormSave}
			/>

			<DeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				serviceName={serviceToDelete?.name ?? ""}
				onConfirm={handleDeleteConfirm}
			/>
		</div>
	);
}
