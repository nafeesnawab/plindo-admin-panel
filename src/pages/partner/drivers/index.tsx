import {
	AlertTriangle,
	Edit,
	FileText,
	MoreVertical,
	Phone,
	Plus,
	Search,
	Trash2,
	Upload,
	User,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { cn } from "@/utils";

// Types
interface Driver {
	id: string;
	fullName: string;
	phone: string;
	email: string;
	licenseNumber: string;
	licenseUrl?: string;
	licenseExpiry: string;
	insuranceUrl?: string;
	insuranceExpiry: string;
	photoUrl?: string;
	status: "active" | "inactive";
	createdAt: string;
}

// Helper to check if date is expiring soon (within 30 days)
const isExpiringSoon = (dateStr: string): boolean => {
	const expiryDate = new Date(dateStr);
	const now = new Date();
	const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
	return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
};

// Helper to check if date is expired
const isExpired = (dateStr: string): boolean => {
	const expiryDate = new Date(dateStr);
	const now = new Date();
	return expiryDate < now;
};

// Format date for display
const formatDate = (dateStr: string): string => {
	return new Date(dateStr).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

// Get expiry status badge
const getExpiryBadge = (dateStr: string) => {
	if (isExpired(dateStr)) {
		return <Badge variant="destructive">Expired</Badge>;
	}
	if (isExpiringSoon(dateStr)) {
		return (
			<Badge variant="outline" className="border-orange-500 text-orange-500">
				<AlertTriangle className="mr-1 h-3 w-3" />
				Expiring Soon
			</Badge>
		);
	}
	return <Badge variant="secondary">{formatDate(dateStr)}</Badge>;
};

// Mock initial data
const mockDrivers: Driver[] = [
	{
		id: "d1",
		fullName: "James Wilson",
		phone: "+1 (555) 123-4567",
		email: "james.wilson@email.com",
		licenseNumber: "DL-123456789",
		licenseUrl: "/uploads/license-james.pdf",
		licenseExpiry: "2025-03-15",
		insuranceUrl: "/uploads/insurance-james.pdf",
		insuranceExpiry: "2025-06-20",
		photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
		status: "active",
		createdAt: "2024-01-15",
	},
	{
		id: "d2",
		fullName: "Michael Chen",
		phone: "+1 (555) 234-5678",
		email: "michael.chen@email.com",
		licenseNumber: "DL-987654321",
		licenseUrl: "/uploads/license-michael.pdf",
		licenseExpiry: "2026-01-10",
		insuranceUrl: "/uploads/insurance-michael.pdf",
		insuranceExpiry: "2025-01-25",
		photoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
		status: "active",
		createdAt: "2024-02-20",
	},
	{
		id: "d3",
		fullName: "David Rodriguez",
		phone: "+1 (555) 345-6789",
		email: "david.r@email.com",
		licenseNumber: "DL-456789123",
		licenseExpiry: "2024-12-01",
		insuranceExpiry: "2024-11-15",
		status: "inactive",
		createdAt: "2024-03-10",
	},
	{
		id: "d4",
		fullName: "Robert Taylor",
		phone: "+1 (555) 456-7890",
		email: "robert.taylor@email.com",
		licenseNumber: "DL-789123456",
		licenseUrl: "/uploads/license-robert.pdf",
		licenseExpiry: "2025-08-30",
		insuranceUrl: "/uploads/insurance-robert.pdf",
		insuranceExpiry: "2025-09-15",
		photoUrl: "https://randomuser.me/api/portraits/men/67.jpg",
		status: "active",
		createdAt: "2024-04-05",
	},
];

// Empty driver form
const emptyDriver: Omit<Driver, "id" | "createdAt"> = {
	fullName: "",
	phone: "",
	email: "",
	licenseNumber: "",
	licenseExpiry: "",
	insuranceExpiry: "",
	status: "active",
};

export default function PartnerDrivers() {
	const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
	const [formData, setFormData] = useState<Omit<Driver, "id" | "createdAt">>(emptyDriver);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const licenseInputRef = useRef<HTMLInputElement>(null);
	const insuranceInputRef = useRef<HTMLInputElement>(null);
	const photoInputRef = useRef<HTMLInputElement>(null);

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

	// Check for expiring documents on load
	useEffect(() => {
		const expiringDrivers = drivers.filter(
			(d) => d.status === "active" && (isExpiringSoon(d.licenseExpiry) || isExpiringSoon(d.insuranceExpiry)),
		);
		if (expiringDrivers.length > 0) {
			toast.warning(`${expiringDrivers.length} driver(s) have documents expiring within 30 days`, {
				duration: 5000,
			});
		}
	}, []);

	// Filter drivers
	const filteredDrivers = drivers.filter((driver) => {
		if (statusFilter !== "all" && driver.status !== statusFilter) return false;
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			return (
				driver.fullName.toLowerCase().includes(query) ||
				driver.phone.includes(query) ||
				driver.email.toLowerCase().includes(query) ||
				driver.licenseNumber.toLowerCase().includes(query)
			);
		}
		return true;
	});

	// Handle open add dialog
	const handleAddDriver = () => {
		setSelectedDriver(null);
		setFormData(emptyDriver);
		setIsDialogOpen(true);
	};

	// Handle open edit dialog
	const handleEditDriver = (driver: Driver) => {
		setSelectedDriver(driver);
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
		setIsDialogOpen(true);
	};

	// Handle delete dialog
	const handleDeleteClick = (driver: Driver) => {
		setSelectedDriver(driver);
		setIsDeleteDialogOpen(true);
	};

	// Handle form submit
	const handleSubmit = async () => {
		if (!formData.fullName || !formData.phone || !formData.email || !formData.licenseNumber) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));

		if (selectedDriver) {
			// Update existing driver
			setDrivers((prev) => prev.map((d) => (d.id === selectedDriver.id ? { ...d, ...formData } : d)));
			toast.success("Driver updated successfully");
		} else {
			// Add new driver
			const newDriver: Driver = {
				...formData,
				id: `d-${Date.now()}`,
				createdAt: new Date().toISOString(),
			};
			setDrivers((prev) => [newDriver, ...prev]);
			toast.success("Driver added successfully");
		}

		setIsSubmitting(false);
		setIsDialogOpen(false);
	};

	// Handle delete
	const handleDelete = async () => {
		if (!selectedDriver) return;

		setIsSubmitting(true);
		await new Promise((resolve) => setTimeout(resolve, 500));

		setDrivers((prev) => prev.filter((d) => d.id !== selectedDriver.id));
		toast.success("Driver deleted successfully");

		setIsSubmitting(false);
		setIsDeleteDialogOpen(false);
		setSelectedDriver(null);
	};

	// Handle toggle status
	const handleToggleStatus = async (driver: Driver) => {
		const newStatus = driver.status === "active" ? "inactive" : "active";
		setDrivers((prev) => prev.map((d) => (d.id === driver.id ? { ...d, status: newStatus } : d)));
		toast.success(`Driver ${newStatus === "active" ? "activated" : "deactivated"}`);
	};

	// Check if driver has document issues
	const hasDocumentIssues = (driver: Driver): boolean => {
		return (
			isExpired(driver.licenseExpiry) ||
			isExpired(driver.insuranceExpiry) ||
			isExpiringSoon(driver.licenseExpiry) ||
			isExpiringSoon(driver.insuranceExpiry)
		);
	};

	// Count drivers with issues
	const driversWithIssues = drivers.filter((d) => d.status === "active" && hasDocumentIssues(d)).length;

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Drivers Management</h1>
					<p className="text-muted-foreground">Manage your team of drivers</p>
				</div>
				<Button onClick={handleAddDriver}>
					<Plus className="mr-2 h-4 w-4" />
					Add Driver
				</Button>
			</div>

			{/* Alerts Banner */}
			{driversWithIssues > 0 && (
				<Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
					<CardContent className="flex items-center gap-3 py-4">
						<AlertTriangle className="h-5 w-5 text-orange-500" />
						<div>
							<p className="font-medium text-orange-700 dark:text-orange-400">Document Expiry Alert</p>
							<p className="text-sm text-orange-600 dark:text-orange-500">
								{driversWithIssues} active driver(s) have documents that are expired or expiring within 30 days.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Filters */}
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle>Drivers</CardTitle>
							<CardDescription>
								{filteredDrivers.length} driver{filteredDrivers.length !== 1 ? "s" : ""} found
							</CardDescription>
						</div>
						<div className="flex flex-col gap-2 sm:flex-row">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search drivers..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9 w-full sm:w-[250px]"
								/>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-full sm:w-[150px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Driver</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead>License Expiry</TableHead>
									<TableHead>Insurance Expiry</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="w-[80px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredDrivers.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
											No drivers found
										</TableCell>
									</TableRow>
								) : (
									filteredDrivers.map((driver) => (
										<TableRow
											key={driver.id}
											className={cn(
												hasDocumentIssues(driver) &&
													driver.status === "active" &&
													"bg-orange-50/50 dark:bg-orange-950/20",
											)}
										>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="relative">
														{driver.photoUrl ? (
															<img
																src={driver.photoUrl}
																alt={driver.fullName}
																className="h-10 w-10 rounded-full object-cover"
															/>
														) : (
															<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
																<User className="h-5 w-5 text-primary" />
															</div>
														)}
														{hasDocumentIssues(driver) && driver.status === "active" && (
															<div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
																<AlertTriangle className="h-2.5 w-2.5 text-white" />
															</div>
														)}
													</div>
													<div>
														<p className="font-medium">{driver.fullName}</p>
														<p className="text-sm text-muted-foreground">{driver.email}</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Phone className="h-4 w-4 text-muted-foreground" />
													{driver.phone}
												</div>
											</TableCell>
											<TableCell>{getExpiryBadge(driver.licenseExpiry)}</TableCell>
											<TableCell>{getExpiryBadge(driver.insuranceExpiry)}</TableCell>
											<TableCell>
												<Badge
													variant={driver.status === "active" ? "default" : "secondary"}
													className={cn(
														driver.status === "active"
															? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
															: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
													)}
												>
													{driver.status === "active" ? "Active" : "Inactive"}
												</Badge>
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon">
															<MoreVertical className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem onClick={() => handleEditDriver(driver)}>
															<Edit className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleToggleStatus(driver)}>
															{driver.status === "active" ? (
																<>
																	<X className="mr-2 h-4 w-4" />
																	Deactivate
																</>
															) : (
																<>
																	<User className="mr-2 h-4 w-4" />
																	Activate
																</>
															)}
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleDeleteClick(driver)} className="text-destructive">
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Add/Edit Driver Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{selectedDriver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
						<DialogDescription>
							{selectedDriver ? "Update driver information and documents" : "Add a new driver to your team"}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-6 py-4">
						{/* Basic Information */}
						<div className="space-y-4">
							<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h4>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="fullName">
										Full Name <span className="text-destructive">*</span>
									</Label>
									<Input
										id="fullName"
										value={formData.fullName}
										onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
										placeholder="Enter full name"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="phone">
										Phone Number <span className="text-destructive">*</span>
									</Label>
									<Input
										id="phone"
										value={formData.phone}
										onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
										placeholder="+1 (555) 123-4567"
									/>
								</div>
								<div className="space-y-2 sm:col-span-2">
									<Label htmlFor="email">
										Email <span className="text-destructive">*</span>
									</Label>
									<Input
										id="email"
										type="email"
										value={formData.email}
										onChange={(e) => setFormData({ ...formData, email: e.target.value })}
										placeholder="driver@email.com"
									/>
								</div>
							</div>
						</div>

						{/* License Information */}
						<div className="space-y-4">
							<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Driver's License</h4>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="licenseNumber">
										License Number <span className="text-destructive">*</span>
									</Label>
									<Input
										id="licenseNumber"
										value={formData.licenseNumber}
										onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
										placeholder="DL-XXXXXXXXX"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="licenseExpiry">
										License Expiry Date <span className="text-destructive">*</span>
									</Label>
									<Input
										id="licenseExpiry"
										type="date"
										value={formData.licenseExpiry}
										onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
									/>
								</div>
								<div className="space-y-2 sm:col-span-2">
									<Label>License Document</Label>
									<div className="flex items-center gap-4">
										<input
											ref={licenseInputRef}
											type="file"
											accept="image/*,.pdf"
											className="hidden"
											onChange={handleLicenseUpload}
										/>
										<Button
											variant="outline"
											className="w-full"
											type="button"
											onClick={() => licenseInputRef.current?.click()}
										>
											<Upload className="mr-2 h-4 w-4" />
											Upload License (Image/PDF)
										</Button>
										{formData.licenseUrl && (
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<FileText className="h-4 w-4" />
												Document uploaded
											</div>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Insurance Information */}
						<div className="space-y-4">
							<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Insurance</h4>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="insuranceExpiry">
										Insurance Expiry Date <span className="text-destructive">*</span>
									</Label>
									<Input
										id="insuranceExpiry"
										type="date"
										value={formData.insuranceExpiry}
										onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
									/>
								</div>
								<div className="space-y-2">
									<Label>Insurance Document</Label>
									<input
										ref={insuranceInputRef}
										type="file"
										accept="image/*,.pdf"
										className="hidden"
										onChange={handleInsuranceUpload}
									/>
									<Button
										variant="outline"
										className="w-full"
										type="button"
										onClick={() => insuranceInputRef.current?.click()}
									>
										<Upload className="mr-2 h-4 w-4" />
										Upload Insurance Paper
									</Button>
									{formData.insuranceUrl && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<FileText className="h-4 w-4" />
											Document uploaded
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Photo & Status */}
						<div className="space-y-4">
							<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Additional</h4>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>Photo (Optional)</Label>
									<div className="flex items-center gap-4">
										{formData.photoUrl && (
											<img src={formData.photoUrl} alt="Driver" className="h-16 w-16 rounded-full object-cover" />
										)}
										<div className="flex-1">
											<input
												ref={photoInputRef}
												type="file"
												accept="image/*"
												className="hidden"
												onChange={handlePhotoUpload}
											/>
											<Button
												variant="outline"
												className="w-full"
												type="button"
												onClick={() => photoInputRef.current?.click()}
											>
												<Upload className="mr-2 h-4 w-4" />
												{formData.photoUrl ? "Change Photo" : "Upload Photo"}
											</Button>
										</div>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="status">Status</Label>
									<Select
										value={formData.status}
										onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="inactive">Inactive</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting ? "Saving..." : selectedDriver ? "Update Driver" : "Add Driver"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Driver</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete {selectedDriver?.fullName}? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
							{isSubmitting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
