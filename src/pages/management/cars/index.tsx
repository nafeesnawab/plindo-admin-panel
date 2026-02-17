import { Pagination } from "antd";
import { Edit, Filter, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

// Types
interface CarData {
	id: string;
	make: string;
	model: string;
	bodyType: string;
	createdAt: string;
	updatedAt: string;
}

// Body types
const CAR_BODY_TYPES = [
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

// Common car makes for quick selection
const COMMON_MAKES = [
	"Audi",
	"BMW",
	"Ford",
	"Honda",
	"Hyundai",
	"Kia",
	"Land Rover",
	"Mazda",
	"Mercedes-Benz",
	"Nissan",
	"Peugeot",
	"Porsche",
	"Renault",
	"Tesla",
	"Toyota",
	"Volkswagen",
	"Volvo",
];

// Initial form state
const getInitialFormState = (): Omit<CarData, "id" | "createdAt" | "updatedAt"> => ({
	make: "",
	model: "",
	bodyType: "",
});

export default function CarsManagementPage() {
	const [cars, setCars] = useState<CarData[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterMake, setFilterMake] = useState<string>("all");
	const [filterBodyType, setFilterBodyType] = useState<string>("all");
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
	const [formData, setFormData] = useState<Omit<CarData, "id" | "createdAt" | "updatedAt">>(getInitialFormState());
	const [isEditing, setIsEditing] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [customMake, setCustomMake] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;

	// Fetch cars
	useEffect(() => {
		const loadCars = async () => {
			try {
				setLoading(true);
				const response = await fetch("/api/admin/cars");
				const data = await response.json();
				if (data.status === 0) {
					setCars(data.data.cars);
				}
			} catch {
				toast.error("Failed to fetch cars");
			} finally {
				setLoading(false);
			}
		};
		loadCars();
	}, []);

	// Get unique makes from cars
	const uniqueMakes = [...new Set(cars.map((car) => car.make))].sort();

	// Filter cars
	const filteredCars = cars.filter((car) => {
		const matchesSearch =
			searchQuery === "" ||
			car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
			car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
			car.bodyType.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesMake = filterMake === "all" || car.make === filterMake;
		const matchesBodyType = filterBodyType === "all" || car.bodyType === filterBodyType;

		return matchesSearch && matchesMake && matchesBodyType;
	});

	// Handlers
	const handleCreateNew = () => {
		setIsEditing(false);
		setSelectedCar(null);
		setFormData(getInitialFormState());
		setCustomMake("");
		setFormDialogOpen(true);
	};

	const handleEdit = (car: CarData) => {
		setIsEditing(true);
		setSelectedCar(car);
		setFormData({
			make: car.make,
			model: car.model,
			bodyType: car.bodyType,
		});
		setCustomMake(COMMON_MAKES.includes(car.make) ? "" : car.make);
		setFormDialogOpen(true);
	};

	const handleDeleteClick = (car: CarData) => {
		setSelectedCar(car);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (selectedCar) {
			try {
				const response = await fetch(`/api/admin/cars/${selectedCar.id}`, {
					method: "DELETE",
				});
				const data = await response.json();
				if (data.status === 0) {
					setCars((prev) => prev.filter((c) => c.id !== selectedCar.id));
					toast.success("Car deleted successfully");
				} else {
					toast.error(data.message || "Failed to delete car");
				}
			} catch {
				toast.error("Failed to delete car");
			}
			setDeleteDialogOpen(false);
			setSelectedCar(null);
		}
	};

	const handleSave = async () => {
		const make = customMake || formData.make;
		if (!make || !formData.model || !formData.bodyType) {
			toast.error("Please fill in all required fields");
			return;
		}

		const payload = {
			...formData,
			make: make,
		};

		try {
			if (isEditing && selectedCar) {
				const response = await fetch(`/api/admin/cars/${selectedCar.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await response.json();
				if (data.status === 0) {
					setCars((prev) => prev.map((c) => (c.id === selectedCar.id ? data.data.car : c)));
					toast.success("Car updated successfully");
				} else {
					toast.error(data.message || "Failed to update car");
					return;
				}
			} else {
				const response = await fetch("/api/admin/cars", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await response.json();
				if (data.status === 0) {
					setCars((prev) => [...prev, data.data.car]);
					toast.success("Car created successfully");
				} else {
					toast.error(data.message || "Failed to create car");
					return;
				}
			}
			setFormDialogOpen(false);
		} catch {
			toast.error("An error occurred");
		}
	};

	const clearFilters = () => {
		setFilterMake("all");
		setFilterBodyType("all");
		setSearchQuery("");
	};

	const getBodyTypeColor = (bodyType: string) => {
		const colors: Record<string, string> = {
			Hatchback: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
			Sedan: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
			SUV: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
			Coupe: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
			Convertible: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
			Van: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
			"Pickup Truck": "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
			"MPV/Minivan": "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
			"Station Wagon": "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
			Crossover: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
		};
		return colors[bodyType] || "bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400";
	};

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardContent className="pt-6 flex-1 min-h-0 flex flex-col">
					<div className="shrink-0 flex flex-col gap-4 mb-4">
						<div className="flex gap-4">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search cars by make, model, or body type..."
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
								{(filterMake !== "all" || filterBodyType !== "all") && (
									<Badge variant="secondary" className="ml-1">
										{[filterMake !== "all", filterBodyType !== "all"].filter(Boolean).length}
									</Badge>
								)}
							</Button>
							<Button onClick={handleCreateNew} className="gap-2">
								<Plus className="h-4 w-4" />
								Add Car
							</Button>
						</div>

						{showFilters && (
							<div className="flex flex-wrap gap-4 pt-2 border-t">
								<div className="flex-1 min-w-[200px]">
									<Label className="text-sm text-muted-foreground mb-2 block">Filter by Make</Label>
									<Select value={filterMake} onValueChange={setFilterMake}>
										<SelectTrigger>
											<SelectValue placeholder="All Makes" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Makes</SelectItem>
											{uniqueMakes.map((make) => (
												<SelectItem key={make} value={make}>
													{make}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex-1 min-w-[200px]">
									<Label className="text-sm text-muted-foreground mb-2 block">Filter by Body Type</Label>
									<Select value={filterBodyType} onValueChange={setFilterBodyType}>
										<SelectTrigger>
											<SelectValue placeholder="All Body Types" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Body Types</SelectItem>
											{CAR_BODY_TYPES.map((type) => (
												<SelectItem key={type} value={type}>
													{type}
												</SelectItem>
											))}
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
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Make</TableHead>
										<TableHead>Model</TableHead>
										<TableHead>Body Type</TableHead>
										<TableHead>Created</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
							</Table>
							<div className="flex-1 min-h-0 overflow-auto">
								<Table>
									<TableBody>
										{filteredCars.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((car) => (
											<TableRow key={car.id}>
												<TableCell className="font-medium">{car.make}</TableCell>
												<TableCell>{car.model}</TableCell>
												<TableCell>
													<Badge className={getBodyTypeColor(car.bodyType)}>{car.bodyType}</Badge>
												</TableCell>
												<TableCell className="text-muted-foreground">
													{new Date(car.createdAt).toLocaleDateString()}
												</TableCell>
												<TableCell className="text-right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon">
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem onClick={() => handleEdit(car)}>
																<Edit className="mr-2 h-4 w-4" />
																Edit
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem onClick={() => handleDeleteClick(car)} className="text-destructive">
																<Trash2 className="mr-2 h-4 w-4" />
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))}
										{filteredCars.length === 0 && (
											<TableRow>
												<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
													{cars.length === 0 ? "No cars added yet" : "No cars match your filters"}
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
							{filteredCars.length > pageSize && (
								<div className="shrink-0 flex justify-center py-3 border-t">
									<Pagination
										current={currentPage}
										total={filteredCars.length}
										pageSize={pageSize}
										onChange={(p) => setCurrentPage(p)}
										showSizeChanger={false}
										showTotal={(total) => `Total ${total} cars`}
									/>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Create/Edit Car Dialog */}
			<Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{isEditing ? "Edit Car" : "Add New Car"}</DialogTitle>
						<DialogDescription>
							{isEditing ? "Update car details" : "Add a new car make and model to the system"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="make">Make / Company *</Label>
							<Select
								value={COMMON_MAKES.includes(formData.make) ? formData.make : "custom"}
								onValueChange={(value) => {
									if (value === "custom") {
										setFormData((prev) => ({ ...prev, make: "" }));
									} else {
										setFormData((prev) => ({ ...prev, make: value }));
										setCustomMake("");
									}
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select make" />
								</SelectTrigger>
								<SelectContent>
									{COMMON_MAKES.map((make) => (
										<SelectItem key={make} value={make}>
											{make}
										</SelectItem>
									))}
									<SelectItem value="custom">Other (Custom)</SelectItem>
								</SelectContent>
							</Select>
							{(!COMMON_MAKES.includes(formData.make) || customMake) && (
								<Input
									placeholder="Enter custom make name"
									value={customMake}
									onChange={(e) => setCustomMake(e.target.value)}
									className="mt-2"
								/>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="model">Model *</Label>
							<Input
								id="model"
								placeholder="e.g., Corolla, Civic, 3 Series"
								value={formData.model}
								onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="bodyType">Body Type *</Label>
							<Select
								value={formData.bodyType}
								onValueChange={(value) => setFormData((prev) => ({ ...prev, bodyType: value }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select body type" />
								</SelectTrigger>
								<SelectContent>
									{CAR_BODY_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setFormDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSave}>{isEditing ? "Update Car" : "Add Car"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Car</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete {selectedCar?.make} {selectedCar?.model}? This action cannot be undone.
							<br />
							<span className="text-yellow-600 font-medium mt-2 block">
								Note: This may affect partner services that have pricing set for this car.
							</span>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDeleteConfirm}>
							Delete Car
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
