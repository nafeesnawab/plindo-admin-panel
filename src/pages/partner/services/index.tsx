import {
	Building2,
	Car,
	Copy,
	Edit,
	Filter,
	Image,
	MapPin,
	MoreHorizontal,
	Plus,
	Power,
	Search,
	Trash2,
	Truck,
	Upload,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Checkbox } from "@/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Switch } from "@/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Textarea } from "@/ui/textarea";
import { cn } from "@/utils";

type ServiceType = "book_me" | "pick_by_me" | "washing_van";

interface CarPricing {
	carId: string;
	make: string;
	model: string;
	bodyType: string;
	price: number;
}

interface DistanceCharges {
	"0-1km": number;
	"1-2km": number;
	"2-3km": number;
}

interface AdminCar {
	id: string;
	make: string;
	model: string;
	bodyType: string;
}

interface Service {
	id: string;
	name: string;
	description: string;
	category: string;
	serviceType: ServiceType;
	duration: number;
	bannerUrl?: string;
	carPricing: CarPricing[];
	distanceCharges?: DistanceCharges;
	features: {
		expressService: boolean;
		parkingAvailable: boolean;
	};
	availability: {
		weekdays: boolean;
		weekends: boolean;
		specificDays: string[];
	};
	status: "active" | "inactive";
	createdAt: string;
}

const SERVICE_CATEGORIES = [
	"Basic Wash",
	"Premium Wash",
	"Interior Cleaning",
	"Full Detailing",
	"Express Wash",
	"Specialty Services",
];

const SERVICE_TYPE_CONFIG: Record<ServiceType, { label: string; icon: React.ReactNode; color: string }> = {
	book_me: {
		label: "Book Me",
		icon: <Building2 className="h-5 w-5" />,
		color: "bg-blue-100 text-blue-800 border-blue-200",
	},
	pick_by_me: {
		label: "Pick By Me",
		icon: <Truck className="h-5 w-5" />,
		color: "bg-purple-100 text-purple-800 border-purple-200",
	},
	washing_van: {
		label: "Washing Van",
		icon: <MapPin className="h-5 w-5" />,
		color: "bg-orange-100 text-orange-800 border-orange-200",
	},
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const getInitialDistanceCharges = (): DistanceCharges => ({
	"0-1km": 3,
	"1-2km": 5,
	"2-3km": 8,
});

const getInitialFormState = (): Omit<Service, "id" | "createdAt"> => ({
	name: "",
	description: "",
	category: "",
	serviceType: "book_me",
	duration: 30,
	bannerUrl: "",
	carPricing: [],
	features: { expressService: false, parkingAvailable: false },
	availability: { weekdays: true, weekends: true, specificDays: DAYS_OF_WEEK },
	status: "active",
});

export default function PartnerServicesPage() {
	const [services, setServices] = useState<Service[]>([]);
	const [adminCars, setAdminCars] = useState<AdminCar[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterServiceType, setFilterServiceType] = useState<string>("all");
	const [filterCategory, setFilterCategory] = useState<string>("all");
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [showFilters, setShowFilters] = useState(false);
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [carPricingDialogOpen, setCarPricingDialogOpen] = useState(false);
	const [selectedService, setSelectedService] = useState<Service | null>(null);
	const [formData, setFormData] = useState<Omit<Service, "id" | "createdAt">>(getInitialFormState());
	const [isEditing, setIsEditing] = useState(false);
	const [selectedMake, setSelectedMake] = useState<string>("");
	const [selectedModel, setSelectedModel] = useState<string>("");
	const [carPrice, setCarPrice] = useState<number>(10);
	const [bannerPreview, setBannerPreview] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const [servicesRes, carsRes] = await Promise.all([fetch("/api/partner/services"), fetch("/api/admin/cars")]);
				const servicesData = await servicesRes.json();
				const carsData = await carsRes.json();
				if (servicesData.status === 0) setServices(servicesData.data.services);
				if (carsData.status === 0) setAdminCars(carsData.data.cars);
			} catch {
				toast.error("Failed to fetch data");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const uniqueMakes = [...new Set(adminCars.map((car) => car.make))].sort();
	const modelsForMake = selectedMake ? adminCars.filter((car) => car.make === selectedMake) : [];

	const filteredServices = services.filter((service) => {
		const matchesSearch =
			searchQuery === "" ||
			service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			service.category.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesType = filterServiceType === "all" || service.serviceType === filterServiceType;
		const matchesCategory = filterCategory === "all" || service.category === filterCategory;
		const matchesStatus = filterStatus === "all" || service.status === filterStatus;
		return matchesSearch && matchesType && matchesCategory && matchesStatus;
	});

	const handleCreateNew = () => {
		setIsEditing(false);
		setSelectedService(null);
		setFormData(getInitialFormState());
		setBannerPreview("");
		setFormDialogOpen(true);
	};

	const handleEdit = (service: Service) => {
		setIsEditing(true);
		setSelectedService(service);
		setFormData({
			name: service.name,
			description: service.description,
			category: service.category,
			serviceType: service.serviceType,
			duration: service.duration,
			bannerUrl: service.bannerUrl || "",
			carPricing: service.carPricing,
			distanceCharges: service.distanceCharges,
			features: service.features,
			availability: service.availability,
			status: service.status,
		});
		setBannerPreview(service.bannerUrl || "");
		setFormDialogOpen(true);
	};

	const handleDuplicate = async (service: Service) => {
		try {
			const response = await fetch(`/api/partner/services/${service.id}/duplicate`, { method: "POST" });
			const data = await response.json();
			if (data.status === 0) {
				setServices((prev) => [...prev, data.data.service]);
				toast.success("Service duplicated");
			} else {
				toast.error(data.message || "Failed to duplicate");
			}
		} catch {
			toast.error("Failed to duplicate service");
		}
	};

	const handleToggleStatus = async (serviceId: string) => {
		try {
			const response = await fetch(`/api/partner/services/${serviceId}/status`, { method: "PATCH" });
			const data = await response.json();
			if (data.status === 0) {
				setServices((prev) => prev.map((s) => (s.id === serviceId ? data.data.service : s)));
				toast.success("Status updated");
			}
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleDeleteClick = (service: Service) => {
		setSelectedService(service);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedService) return;
		try {
			const response = await fetch(`/api/partner/services/${selectedService.id}`, { method: "DELETE" });
			const data = await response.json();
			if (data.status === 0) {
				setServices((prev) => prev.filter((s) => s.id !== selectedService.id));
				toast.success("Service deleted");
			}
		} catch {
			toast.error("Failed to delete");
		}
		setDeleteDialogOpen(false);
		setSelectedService(null);
	};

	const handleSave = async () => {
		if (!formData.name || !formData.category || !formData.serviceType) {
			toast.error("Please fill in all required fields");
			return;
		}
		if (formData.carPricing.length === 0) {
			toast.error("Please add at least one car pricing");
			return;
		}

		const payload = {
			...formData,
			bannerUrl: bannerPreview || formData.bannerUrl,
			distanceCharges:
				formData.serviceType === "pick_by_me" ? formData.distanceCharges || getInitialDistanceCharges() : undefined,
		};

		try {
			if (isEditing && selectedService) {
				const response = await fetch(`/api/partner/services/${selectedService.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await response.json();
				if (data.status === 0) {
					setServices((prev) => prev.map((s) => (s.id === selectedService.id ? data.data.service : s)));
					toast.success("Service updated");
				} else {
					toast.error(data.message || "Failed to update");
					return;
				}
			} else {
				const response = await fetch("/api/partner/services", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await response.json();
				if (data.status === 0) {
					setServices((prev) => [...prev, data.data.service]);
					toast.success("Service created");
				} else {
					toast.error(data.message || "Failed to create");
					return;
				}
			}
			setFormDialogOpen(false);
		} catch {
			toast.error("An error occurred");
		}
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
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
		}
	};

	const handleRemoveBanner = () => {
		setBannerPreview("");
		setFormData((prev) => ({ ...prev, bannerUrl: "" }));
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleAddCarPricing = () => {
		if (!selectedMake || !selectedModel || carPrice <= 0) {
			toast.error("Please select make, model and enter a valid price");
			return;
		}
		const car = adminCars.find((c) => c.make === selectedMake && c.model === selectedModel);
		if (!car) return;
		if (formData.carPricing.some((cp) => cp.make === selectedMake && cp.model === selectedModel)) {
			toast.error("This car is already added");
			return;
		}
		setFormData((prev) => ({
			...prev,
			carPricing: [
				...prev.carPricing,
				{ carId: car.id, make: car.make, model: car.model, bodyType: car.bodyType, price: carPrice },
			],
		}));
		setSelectedMake("");
		setSelectedModel("");
		setCarPrice(10);
		setCarPricingDialogOpen(false);
	};

	const handleRemoveCarPricing = (carId: string) => {
		setFormData((prev) => ({ ...prev, carPricing: prev.carPricing.filter((cp) => cp.carId !== carId) }));
	};

	const handleUpdateCarPrice = (carId: string, price: number) => {
		setFormData((prev) => ({
			...prev,
			carPricing: prev.carPricing.map((cp) => (cp.carId === carId ? { ...cp, price } : cp)),
		}));
	};

	const handleDayToggle = (day: string) => {
		setFormData((prev) => ({
			...prev,
			availability: {
				...prev.availability,
				specificDays: prev.availability.specificDays.includes(day)
					? prev.availability.specificDays.filter((d) => d !== day)
					: [...prev.availability.specificDays, day],
			},
		}));
	};

	const handleServiceTypeChange = (type: ServiceType) => {
		setFormData((prev) => ({
			...prev,
			serviceType: type,
			distanceCharges: type === "pick_by_me" ? getInitialDistanceCharges() : undefined,
		}));
	};

	const getBasePrice = (service: Service) => {
		if (service.carPricing.length === 0) return "N/A";
		const prices = service.carPricing.map((cp) => cp.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		return minPrice === maxPrice ? `£${minPrice}` : `£${minPrice} - £${maxPrice}`;
	};

	const formatDuration = (minutes: number) => {
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	};

	const clearFilters = () => {
		setFilterServiceType("all");
		setFilterCategory("all");
		setFilterStatus("all");
		setSearchQuery("");
	};

	const activeFiltersCount = [filterServiceType !== "all", filterCategory !== "all", filterStatus !== "all"].filter(
		Boolean,
	).length;

	const needsDistanceCharges = formData.serviceType === "pick_by_me";

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Services</h1>
					<p className="text-muted-foreground">Manage your car wash services and pricing</p>
				</div>
				<Button onClick={handleCreateNew} className="gap-2">
					<Plus className="h-4 w-4" />
					Add Service
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col gap-4">
						<div className="flex gap-4">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search services..."
									className="pl-10"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
							<Button
								variant={showFilters ? "secondary" : "outline"}
								onClick={() => setShowFilters(!showFilters)}
								className="gap-2"
							>
								<Filter className="h-4 w-4" />
								Filters
								{activeFiltersCount > 0 && (
									<Badge variant="secondary" className="ml-1">
										{activeFiltersCount}
									</Badge>
								)}
							</Button>
						</div>
						{showFilters && (
							<div className="flex flex-wrap gap-4 pt-2 border-t">
								<div className="flex-1 min-w-[180px]">
									<Label className="text-sm text-muted-foreground mb-2 block">Service Type</Label>
									<Select value={filterServiceType} onValueChange={setFilterServiceType}>
										<SelectTrigger>
											<SelectValue placeholder="All Types" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Types</SelectItem>
											<SelectItem value="book_me">Book Me</SelectItem>
											<SelectItem value="pick_by_me">Pick By Me</SelectItem>
											<SelectItem value="washing_van">Washing Van</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex-1 min-w-[180px]">
									<Label className="text-sm text-muted-foreground mb-2 block">Category</Label>
									<Select value={filterCategory} onValueChange={setFilterCategory}>
										<SelectTrigger>
											<SelectValue placeholder="All Categories" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Categories</SelectItem>
											{SERVICE_CATEGORIES.map((cat) => (
												<SelectItem key={cat} value={cat}>
													{cat}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex-1 min-w-[180px]">
									<Label className="text-sm text-muted-foreground mb-2 block">Status</Label>
									<Select value={filterStatus} onValueChange={setFilterStatus}>
										<SelectTrigger>
											<SelectValue placeholder="All Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Status</SelectItem>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="inactive">Inactive</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-end">
									<Button variant="ghost" onClick={clearFilters}>
										Clear Filters
									</Button>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>All Services</CardTitle>
					<CardDescription>
						{filteredServices.length} of {services.length} services{activeFiltersCount > 0 && " (filtered)"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Service</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Price Range</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredServices.map((service) => (
									<TableRow key={service.id} className="cursor-pointer hover:bg-muted/50">
										<TableCell>
											<div className="flex items-center gap-3">
												{service.bannerUrl ? (
													<img
														src={service.bannerUrl}
														alt={service.name}
														className="w-12 h-12 rounded-lg object-cover"
													/>
												) : (
													<div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
														<Image className="h-5 w-5 text-muted-foreground" />
													</div>
												)}
												<div>
													<p className="font-medium">{service.name}</p>
													<p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
														{service.description}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge className={SERVICE_TYPE_CONFIG[service.serviceType].color}>
												{SERVICE_TYPE_CONFIG[service.serviceType].label}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge variant="outline">{service.category}</Badge>
										</TableCell>
										<TableCell className="font-medium">{getBasePrice(service)}</TableCell>
										<TableCell>{formatDuration(service.duration)}</TableCell>
										<TableCell>
											<Badge
												className={cn(
													service.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800",
												)}
											>
												{service.status}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => handleEdit(service)}>
														<Edit className="mr-2 h-4 w-4" />
														Edit
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleDuplicate(service)}>
														<Copy className="mr-2 h-4 w-4" />
														Duplicate
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleToggleStatus(service.id)}>
														<Power className="mr-2 h-4 w-4" />
														{service.status === "active" ? "Deactivate" : "Activate"}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem onClick={() => handleDeleteClick(service)} className="text-destructive">
														<Trash2 className="mr-2 h-4 w-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
								{filteredServices.length === 0 && (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
											{services.length === 0 ? "No services added yet" : "No services match your filters"}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Create/Edit Service Dialog */}
			<Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
				<DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden p-6">
					<DialogHeader>
						<DialogTitle>{isEditing ? "Edit Service" : "Create New Service"}</DialogTitle>
						<DialogDescription>
							{isEditing ? "Update your service details" : "Add a new service to your offerings"}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-6 py-4 w-full">
						{/* Service Type - Show selection when creating, display when editing */}
						{isEditing ? (
							<div className="space-y-2 w-full">
								<h3 className="font-semibold text-base">Service Type</h3>
								<div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
									<div className={cn("p-2 rounded-lg", SERVICE_TYPE_CONFIG[formData.serviceType].color)}>
										<div className="w-4 h-4">{SERVICE_TYPE_CONFIG[formData.serviceType].icon}</div>
									</div>
									<span className="font-medium text-sm">{SERVICE_TYPE_CONFIG[formData.serviceType].label}</span>
								</div>
							</div>
						) : (
							<div className="space-y-3 w-full">
								<div>
									<h3 className="font-semibold text-base">Service Type *</h3>
									<p className="text-xs text-muted-foreground">
										Choose how this service will be delivered to customers
									</p>
								</div>
								<div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
									{(Object.keys(SERVICE_TYPE_CONFIG) as ServiceType[]).map((type) => {
										const config = SERVICE_TYPE_CONFIG[type];
										const isSelected = formData.serviceType === type;
										return (
											<button
												key={type}
												type="button"
												onClick={() => handleServiceTypeChange(type)}
												className={cn(
													"border-2 rounded-lg p-2.5 text-left transition-all w-full cursor-pointer",
													isSelected
														? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
														: "border-border hover:border-primary/50 hover:bg-muted/50",
												)}
											>
												<div className="flex items-center gap-2">
													<div className={cn("p-1.5 rounded-lg shrink-0", config.color)}>
														<div className="w-4 h-4">{config.icon}</div>
													</div>
													<h4 className="font-medium text-sm">{config.label}</h4>
												</div>
											</button>
										);
									})}
								</div>
							</div>
						)}

						{/* Basic Information */}
						<div className="space-y-3 w-full">
							<h3 className="font-semibold text-base border-b pb-2">Basic Information</h3>
							<div className="grid gap-3 grid-cols-1 md:grid-cols-2 w-full">
								<div className="space-y-1.5">
									<Label htmlFor="name" className="text-sm">
										Service Name *
									</Label>
									<Input
										id="name"
										placeholder="e.g., Basic Exterior Wash"
										value={formData.name}
										onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="category" className="text-sm">
										Category *
									</Label>
									<Select
										value={formData.category}
										onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											{SERVICE_CATEGORIES.map((cat) => (
												<SelectItem key={cat} value={cat}>
													{cat}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="description" className="text-sm">
									Description (max 500 chars)
								</Label>
								<Textarea
									id="description"
									placeholder="Describe your service..."
									value={formData.description}
									onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value.slice(0, 500) }))}
									className="min-h-[80px] resize-none text-sm"
								/>
								<p className="text-xs text-muted-foreground text-right">{formData.description.length}/500</p>
							</div>
							<div className="grid gap-3 grid-cols-1 md:grid-cols-2 w-full">
								<div className="space-y-1.5">
									<Label htmlFor="duration" className="text-sm">
										Duration (minutes) *
									</Label>
									<Input
										id="duration"
										type="number"
										min={5}
										step={5}
										value={formData.duration}
										onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-sm">Status</Label>
									<div className="flex items-center gap-3 pt-2">
										<Switch
											checked={formData.status === "active"}
											onCheckedChange={(checked) =>
												setFormData((prev) => ({ ...prev, status: checked ? "active" : "inactive" }))
											}
										/>
										<span className="text-sm font-medium">{formData.status === "active" ? "Active" : "Inactive"}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Service Banner - Direct Upload */}
						<div className="space-y-3 w-full">
							<h3 className="font-semibold text-base border-b pb-2">Service Banner</h3>
							<div className="space-y-2">
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleFileUpload}
									className="hidden"
									id="banner-upload"
								/>
								{bannerPreview ? (
									<div className="relative w-full h-40 rounded-lg overflow-hidden border">
										<img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
										<div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
											<Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
												<Upload className="h-4 w-4 mr-2" />
												Change
											</Button>
											<Button variant="destructive" size="sm" onClick={handleRemoveBanner}>
												<X className="h-4 w-4 mr-2" />
												Remove
											</Button>
										</div>
									</div>
								) : (
									<label
										htmlFor="banner-upload"
										className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
									>
										<Upload className="h-8 w-8 text-muted-foreground mb-2" />
										<span className="text-xs font-medium">Click to upload banner image</span>
										<span className="text-xs text-muted-foreground mt-0.5">PNG, JPG up to 5MB</span>
									</label>
								)}
							</div>
						</div>

						{/* Distance Charges - For pick_by_me only */}
						{needsDistanceCharges && (
							<div className="space-y-3 w-full">
								<div>
									<h3 className="font-semibold text-base border-b pb-2">Distance-Based Charges</h3>
									<p className="text-xs text-muted-foreground mt-1.5">
										Set additional charges for picking up and delivering the car based on distance (max 3km)
									</p>
								</div>
								<div className="grid gap-3 grid-cols-3 w-full">
									<div className="space-y-1.5">
										<Label className="text-sm">0-1 km (£)</Label>
										<Input
											type="number"
											min={0}
											step={0.5}
											value={formData.distanceCharges?.["0-1km"] ?? 3}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													distanceCharges: {
														...getInitialDistanceCharges(),
														...prev.distanceCharges,
														"0-1km": parseFloat(e.target.value) || 0,
													},
												}))
											}
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-sm">1-2 km (£)</Label>
										<Input
											type="number"
											min={0}
											step={0.5}
											value={formData.distanceCharges?.["1-2km"] ?? 5}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													distanceCharges: {
														...getInitialDistanceCharges(),
														...prev.distanceCharges,
														"1-2km": parseFloat(e.target.value) || 0,
													},
												}))
											}
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-sm">2-3 km (£)</Label>
										<Input
											type="number"
											min={0}
											step={0.5}
											value={formData.distanceCharges?.["2-3km"] ?? 8}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													distanceCharges: {
														...getInitialDistanceCharges(),
														...prev.distanceCharges,
														"2-3km": parseFloat(e.target.value) || 0,
													},
												}))
											}
										/>
									</div>
								</div>
							</div>
						)}

						{/* Car Pricing */}
						<div className="space-y-3 w-full">
							<div className="flex items-center justify-between border-b pb-2">
								<div>
									<h3 className="font-semibold text-base">Car Pricing *</h3>
									<p className="text-xs text-muted-foreground">Set base prices for different car makes and models</p>
								</div>
								<Button variant="outline" size="sm" onClick={() => setCarPricingDialogOpen(true)} className="gap-2">
									<Plus className="h-4 w-4" />
									Add Car Price
								</Button>
							</div>
							{formData.carPricing.length > 0 ? (
								<div className="border rounded-lg overflow-x-auto w-full">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="text-xs">Make</TableHead>
												<TableHead className="text-xs">Model</TableHead>
												<TableHead className="text-xs">Body Type</TableHead>
												<TableHead className="text-xs">Price (£)</TableHead>
												<TableHead className="text-right text-xs">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{formData.carPricing.map((cp) => (
												<TableRow key={cp.carId}>
													<TableCell className="font-medium text-xs">{cp.make}</TableCell>
													<TableCell className="text-xs">{cp.model}</TableCell>
													<TableCell>
														<Badge variant="outline" className="text-xs">
															{cp.bodyType}
														</Badge>
													</TableCell>
													<TableCell>
														<Input
															type="number"
															min={0}
															step={0.5}
															value={cp.price}
															onChange={(e) => handleUpdateCarPrice(cp.carId, parseFloat(e.target.value) || 0)}
															className="w-20 h-8 text-xs"
														/>
													</TableCell>
													<TableCell className="text-right">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															onClick={() => handleRemoveCarPricing(cp.carId)}
														>
															<Trash2 className="h-3.5 w-3.5 text-destructive" />
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							) : (
								<div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
									<Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
									<p className="text-sm font-medium">No car pricing added yet</p>
									<p className="text-xs mt-1">Click "Add Car Price" to set prices for different cars</p>
								</div>
							)}
						</div>

						{/* Service Features */}
						<div className="space-y-3 w-full">
							<h3 className="font-semibold text-base border-b pb-2">Service Features</h3>
							<div className="grid gap-3 grid-cols-1 md:grid-cols-2 w-full">
								<label className="flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
									<Checkbox
										id="expressService"
										checked={formData.features.expressService}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												features: { ...prev.features, expressService: checked as boolean },
											}))
										}
									/>
									<div>
										<p className="font-medium text-sm">Express Service</p>
										<p className="text-xs text-muted-foreground">Available for quick wash requests</p>
									</div>
								</label>
								<label className="flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
									<Checkbox
										id="parkingAvailable"
										checked={formData.features.parkingAvailable}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												features: { ...prev.features, parkingAvailable: checked as boolean },
											}))
										}
									/>
									<div>
										<p className="font-medium text-sm">Parking Available</p>
										<p className="text-xs text-muted-foreground">Parking service is available at your location</p>
									</div>
								</label>
							</div>
						</div>

						{/* Availability */}
						<div className="space-y-3 w-full">
							<h3 className="font-semibold text-base border-b pb-2">Availability</h3>
							<div className="flex flex-wrap gap-4">
								<label className="flex items-center gap-2 cursor-pointer">
									<Checkbox
										id="weekdays"
										checked={formData.availability.weekdays}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												availability: { ...prev.availability, weekdays: checked as boolean },
											}))
										}
									/>
									<span className="text-sm font-medium">Available on weekdays</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<Checkbox
										id="weekends"
										checked={formData.availability.weekends}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												availability: { ...prev.availability, weekends: checked as boolean },
											}))
										}
									/>
									<span className="text-sm font-medium">Available on weekends</span>
								</label>
							</div>
							<div className="space-y-1.5">
								<Label className="text-sm">Specific Days</Label>
								<div className="flex flex-wrap gap-2">
									{DAYS_OF_WEEK.map((day) => (
										<Button
											key={day}
											type="button"
											variant={formData.availability.specificDays.includes(day) ? "default" : "outline"}
											size="sm"
											onClick={() => handleDayToggle(day)}
										>
											{day.slice(0, 3)}
										</Button>
									))}
								</div>
							</div>
						</div>
					</div>
					<DialogFooter className="gap-3">
						<Button variant="outline" onClick={() => setFormDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSave}>{isEditing ? "Update Service" : "Create Service"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add Car Pricing Dialog */}
			<Dialog open={carPricingDialogOpen} onOpenChange={setCarPricingDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Add Car Pricing</DialogTitle>
						<DialogDescription>Select a car and set the base price for this service</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Make / Company *</Label>
							<Select
								value={selectedMake}
								onValueChange={(value) => {
									setSelectedMake(value);
									setSelectedModel("");
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select make" />
								</SelectTrigger>
								<SelectContent>
									{uniqueMakes.map((make) => (
										<SelectItem key={make} value={make}>
											{make}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Model *</Label>
							<Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedMake}>
								<SelectTrigger>
									<SelectValue placeholder="Select model" />
								</SelectTrigger>
								<SelectContent>
									{modelsForMake.map((car) => (
										<SelectItem key={car.id} value={car.model}>
											{car.model} ({car.bodyType})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Base Price (£) *</Label>
							<Input
								type="number"
								min={0}
								step={0.5}
								value={carPrice}
								onChange={(e) => setCarPrice(parseFloat(e.target.value) || 0)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCarPricingDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleAddCarPricing}>Add Price</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Service</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{selectedService?.name}"? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDeleteConfirm}>
							Delete Service
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
