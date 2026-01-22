import { Copy, Edit, MoreHorizontal, Plus, Power, Search, Trash2 } from "lucide-react";
import { useState } from "react";
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

// Types
interface BodyTypePricing {
	bodyType: string;
	price: number;
	enabled: boolean;
}

interface Service {
	id: string;
	name: string;
	description: string;
	category: string;
	duration: number;
	imageUrl?: string;
	bodyTypePricing: BodyTypePricing[];
	features: {
		pickAndClean: boolean;
		atYourPlace: boolean;
		atShopOnly: boolean;
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

// Body types
const BODY_TYPES = [
	"Hatchback",
	"Sedan",
	"SUV",
	"Coupe",
	"Convertible",
	"Van",
	"Pickup Truck",
	"MPV/Minivan",
	"Station Wagon",
	"Crossover",
];

const DEFAULT_BODY_TYPE_PRICES: Record<string, number> = {
	Hatchback: 10,
	Sedan: 12,
	SUV: 15,
	Coupe: 12,
	Convertible: 14,
	Van: 18,
	"Pickup Truck": 16,
	"MPV/Minivan": 15,
	"Station Wagon": 13,
	Crossover: 14,
};

// Service categories
const SERVICE_CATEGORIES = [
	"Basic Wash",
	"Premium Wash",
	"Interior Cleaning",
	"Full Detailing",
	"Express Wash",
	"Specialty Services",
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Mock services
const mockServices: Service[] = [
	{
		id: "1",
		name: "Basic Exterior Wash",
		description: "Quick exterior wash including rinse, soap, and hand dry.",
		category: "Basic Wash",
		duration: 30,
		bodyTypePricing: BODY_TYPES.map((type) => ({
			bodyType: type,
			price: DEFAULT_BODY_TYPE_PRICES[type],
			enabled: true,
		})),
		features: {
			pickAndClean: true,
			atYourPlace: true,
			atShopOnly: true,
			expressService: true,
			parkingAvailable: true,
		},
		availability: {
			weekdays: true,
			weekends: true,
			specificDays: DAYS_OF_WEEK,
		},
		status: "active",
		createdAt: "2024-01-15",
	},
	{
		id: "2",
		name: "Premium Full Detail",
		description: "Complete interior and exterior detailing with wax and polish.",
		category: "Full Detailing",
		duration: 180,
		bodyTypePricing: BODY_TYPES.map((type) => ({
			bodyType: type,
			price: DEFAULT_BODY_TYPE_PRICES[type] * 3,
			enabled: true,
		})),
		features: {
			pickAndClean: true,
			atYourPlace: false,
			atShopOnly: true,
			expressService: false,
			parkingAvailable: true,
		},
		availability: {
			weekdays: true,
			weekends: false,
			specificDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
		},
		status: "active",
		createdAt: "2024-01-10",
	},
	{
		id: "3",
		name: "Interior Deep Clean",
		description: "Thorough interior cleaning including seats, carpets, and dashboard.",
		category: "Interior Cleaning",
		duration: 90,
		bodyTypePricing: BODY_TYPES.map((type) => ({
			bodyType: type,
			price: DEFAULT_BODY_TYPE_PRICES[type] * 2,
			enabled: true,
		})),
		features: {
			pickAndClean: true,
			atYourPlace: true,
			atShopOnly: true,
			expressService: false,
			parkingAvailable: true,
		},
		availability: {
			weekdays: true,
			weekends: true,
			specificDays: DAYS_OF_WEEK,
		},
		status: "inactive",
		createdAt: "2024-01-05",
	},
];

// Initial form state
const getInitialFormState = (): Omit<Service, "id" | "createdAt"> => ({
	name: "",
	description: "",
	category: "",
	duration: 30,
	imageUrl: "",
	bodyTypePricing: BODY_TYPES.map((type) => ({
		bodyType: type,
		price: DEFAULT_BODY_TYPE_PRICES[type],
		enabled: true,
	})),
	features: {
		pickAndClean: false,
		atYourPlace: false,
		atShopOnly: true,
		expressService: false,
		parkingAvailable: false,
	},
	availability: {
		weekdays: true,
		weekends: true,
		specificDays: DAYS_OF_WEEK,
	},
	status: "active",
});

export default function PartnerServicesPage() {
	const [services, setServices] = useState<Service[]>(mockServices);
	const [searchQuery, setSearchQuery] = useState("");
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedService, setSelectedService] = useState<Service | null>(null);
	const [formData, setFormData] = useState<Omit<Service, "id" | "createdAt">>(getInitialFormState());
	const [isEditing, setIsEditing] = useState(false);

	// Filter services
	const filteredServices = services.filter(
		(service) =>
			service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			service.category.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Handlers
	const handleCreateNew = () => {
		setIsEditing(false);
		setSelectedService(null);
		setFormData(getInitialFormState());
		setFormDialogOpen(true);
	};

	const handleEdit = (service: Service) => {
		setIsEditing(true);
		setSelectedService(service);
		setFormData({
			name: service.name,
			description: service.description,
			category: service.category,
			duration: service.duration,
			imageUrl: service.imageUrl,
			bodyTypePricing: service.bodyTypePricing,
			features: service.features,
			availability: service.availability,
			status: service.status,
		});
		setFormDialogOpen(true);
	};

	const handleDuplicate = (service: Service) => {
		const newService: Service = {
			...service,
			id: `${Date.now()}`,
			name: `${service.name} (Copy)`,
			createdAt: new Date().toISOString().split("T")[0],
		};
		setServices((prev) => [...prev, newService]);
		toast.success("Service duplicated");
	};

	const handleToggleStatus = (serviceId: string) => {
		setServices((prev) =>
			prev.map((s) => (s.id === serviceId ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s)),
		);
		toast.success("Service status updated");
	};

	const handleDeleteClick = (service: Service) => {
		setSelectedService(service);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (selectedService) {
			setServices((prev) => prev.filter((s) => s.id !== selectedService.id));
			toast.success("Service deleted");
			setDeleteDialogOpen(false);
			setSelectedService(null);
		}
	};

	const handleSave = () => {
		if (!formData.name || !formData.category) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (isEditing && selectedService) {
			setServices((prev) => prev.map((s) => (s.id === selectedService.id ? { ...s, ...formData } : s)));
			toast.success("Service updated");
		} else {
			const newService: Service = {
				...formData,
				id: `${Date.now()}`,
				createdAt: new Date().toISOString().split("T")[0],
			};
			setServices((prev) => [...prev, newService]);
			toast.success("Service created");
		}
		setFormDialogOpen(false);
	};

	const handleBodyTypePriceChange = (bodyType: string, price: number) => {
		setFormData((prev) => ({
			...prev,
			bodyTypePricing: prev.bodyTypePricing.map((bt) => (bt.bodyType === bodyType ? { ...bt, price } : bt)),
		}));
	};

	const handleBodyTypeToggle = (bodyType: string, enabled: boolean) => {
		setFormData((prev) => ({
			...prev,
			bodyTypePricing: prev.bodyTypePricing.map((bt) => (bt.bodyType === bodyType ? { ...bt, enabled } : bt)),
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

	const getBasePrice = (service: Service) => {
		const enabledPrices = service.bodyTypePricing.filter((bt) => bt.enabled);
		if (enabledPrices.length === 0) return "N/A";
		const minPrice = Math.min(...enabledPrices.map((bt) => bt.price));
		const maxPrice = Math.max(...enabledPrices.map((bt) => bt.price));
		return minPrice === maxPrice ? `€${minPrice}` : `€${minPrice} - €${maxPrice}`;
	};

	const formatDuration = (minutes: number) => {
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
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

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search services..."
							className="pl-10"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Services Table */}
			<Card>
				<CardHeader>
					<CardTitle>All Services</CardTitle>
					<CardDescription>{filteredServices.length} services total</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Service Name</TableHead>
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
										<div>
											<p className="font-medium">{service.name}</p>
											<p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
										</div>
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
									<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
										No services found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Create/Edit Service Dialog */}
			<Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{isEditing ? "Edit Service" : "Create New Service"}</DialogTitle>
						<DialogDescription>
							{isEditing ? "Update your service details" : "Add a new service to your offerings"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 py-4">
						{/* Basic Information */}
						<div className="space-y-4">
							<h3 className="font-semibold">Basic Information</h3>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="name">Service Name *</Label>
									<Input
										id="name"
										placeholder="e.g., Basic Exterior Wash"
										value={formData.name}
										onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="category">Category *</Label>
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
							<div className="space-y-2">
								<Label htmlFor="description">Description (max 500 chars)</Label>
								<Textarea
									id="description"
									placeholder="Describe your service..."
									value={formData.description}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											description: e.target.value.slice(0, 500),
										}))
									}
									className="min-h-[80px]"
								/>
								<p className="text-xs text-muted-foreground text-right">{formData.description.length}/500</p>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="duration">Duration (minutes) *</Label>
									<Input
										id="duration"
										type="number"
										min={5}
										step={5}
										value={formData.duration}
										onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
									/>
								</div>
								<div className="space-y-2">
									<Label>Status</Label>
									<div className="flex items-center gap-2 pt-2">
										<Switch
											checked={formData.status === "active"}
											onCheckedChange={(checked) =>
												setFormData((prev) => ({ ...prev, status: checked ? "active" : "inactive" }))
											}
										/>
										<span className="text-sm">{formData.status === "active" ? "Active" : "Inactive"}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Body Type Pricing */}
						<div className="space-y-4">
							<h3 className="font-semibold">Body Type Pricing</h3>
							<p className="text-sm text-muted-foreground">
								Set different prices for each vehicle body type. Disable types you don't service.
							</p>
							<div className="border rounded-lg overflow-hidden">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Body Type</TableHead>
											<TableHead>Price (€)</TableHead>
											<TableHead className="text-center">Enabled</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{formData.bodyTypePricing.map((bt) => (
											<TableRow key={bt.bodyType}>
												<TableCell className="font-medium">{bt.bodyType}</TableCell>
												<TableCell>
													<Input
														type="number"
														min={0}
														step={0.5}
														value={bt.price}
														onChange={(e) => handleBodyTypePriceChange(bt.bodyType, parseFloat(e.target.value) || 0)}
														className="w-24"
														disabled={!bt.enabled}
													/>
												</TableCell>
												<TableCell className="text-center">
													<Checkbox
														checked={bt.enabled}
														onCheckedChange={(checked) => handleBodyTypeToggle(bt.bodyType, checked as boolean)}
													/>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>

						{/* Service Features */}
						<div className="space-y-4">
							<h3 className="font-semibold">Service Features</h3>
							<div className="grid gap-3 md:grid-cols-2">
								<div className="flex items-center gap-2">
									<Checkbox
										id="pickAndClean"
										checked={formData.features.pickAndClean}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												features: { ...prev.features, pickAndClean: checked as boolean },
											}))
										}
									/>
									<Label htmlFor="pickAndClean" className="cursor-pointer">
										Pick & Clean (pick up from customer location)
									</Label>
								</div>
								<div className="flex items-center gap-2">
									<Checkbox
										id="atYourPlace"
										checked={formData.features.atYourPlace}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												features: { ...prev.features, atYourPlace: checked as boolean },
											}))
										}
									/>
									<Label htmlFor="atYourPlace" className="cursor-pointer">
										At Your Place (wash at customer location)
									</Label>
								</div>
								<div className="flex items-center gap-2">
									<Checkbox
										id="atShopOnly"
										checked={formData.features.atShopOnly}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												features: { ...prev.features, atShopOnly: checked as boolean },
											}))
										}
									/>
									<Label htmlFor="atShopOnly" className="cursor-pointer">
										At Shop Only (customer brings car)
									</Label>
								</div>
								<div className="flex items-center gap-2">
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
									<Label htmlFor="expressService" className="cursor-pointer">
										Express Service (available for quick wash)
									</Label>
								</div>
								<div className="flex items-center gap-2">
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
									<Label htmlFor="parkingAvailable" className="cursor-pointer">
										Parking Service Available
									</Label>
								</div>
							</div>
						</div>

						{/* Availability */}
						<div className="space-y-4">
							<h3 className="font-semibold">Availability</h3>
							<div className="flex gap-6">
								<div className="flex items-center gap-2">
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
									<Label htmlFor="weekdays" className="cursor-pointer">
										Available on weekdays
									</Label>
								</div>
								<div className="flex items-center gap-2">
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
									<Label htmlFor="weekends" className="cursor-pointer">
										Available on weekends
									</Label>
								</div>
							</div>
							<div className="space-y-2">
								<Label>Specific Days</Label>
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

					<DialogFooter>
						<Button variant="outline" onClick={() => setFormDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSave}>{isEditing ? "Update Service" : "Create Service"}</Button>
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
