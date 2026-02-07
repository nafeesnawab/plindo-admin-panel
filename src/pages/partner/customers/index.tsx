import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Car,
	CreditCard,
	Mail,
	MapPin,
	Phone,
	Search,
	Star,
	User,
} from "lucide-react";
import { useState } from "react";
import customerService from "@/api/services/customerService";
import type { Customer } from "@/api/services/customerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { cn } from "@/utils";

export default function PartnerCustomersPage() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const limit = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["partner-customers", search, statusFilter, page],
		queryFn: () =>
			customerService.getCustomers({
				search: search || undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
				page,
				limit,
			}),
	});

	const customers = data?.items ?? [];
	const totalPages = data?.totalPages ?? 1;
	const total = data?.total ?? 0;

	const handleViewCustomer = (customer: Customer) => {
		setSelectedCustomer(customer);
		setDetailsOpen(true);
	};

	if (isLoading) {
		return (
			<div className="flex flex-col gap-6 p-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-[400px] w-full" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold">Customers</h1>
				<p className="text-muted-foreground">View customers who have booked with your business</p>
			</div>

			{/* Stats */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardContent className="flex items-center gap-4 pt-6">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
							<User className="h-5 w-5" />
						</div>
						<div>
							<p className="text-2xl font-bold">{total}</p>
							<p className="text-sm text-muted-foreground">Total Customers</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center gap-4 pt-6">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
							<Star className="h-5 w-5" />
						</div>
						<div>
							<p className="text-2xl font-bold">
								{customers.filter((c) => c.subscription.active).length}
							</p>
							<p className="text-sm text-muted-foreground">With Subscriptions</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center gap-4 pt-6">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
							<Car className="h-5 w-5" />
						</div>
						<div>
							<p className="text-2xl font-bold">
								{customers.reduce((sum, c) => sum + c.vehicles.length, 0)}
							</p>
							<p className="text-sm text-muted-foreground">Vehicles Registered</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle>Customer List</CardTitle>
							<CardDescription>
								{total} customer{total !== 1 ? "s" : ""} found
							</CardDescription>
						</div>
						<div className="flex flex-col gap-2 sm:flex-row">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search customers..."
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										setPage(1);
									}}
									className="pl-9 w-full sm:w-[250px]"
								/>
							</div>
							<Select
								value={statusFilter}
								onValueChange={(v) => {
									setStatusFilter(v);
									setPage(1);
								}}
							>
								<SelectTrigger className="w-full sm:w-[150px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="suspended">Suspended</SelectItem>
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
									<TableHead>Customer</TableHead>
									<TableHead>Location</TableHead>
									<TableHead>Bookings</TableHead>
									<TableHead>Total Spent</TableHead>
									<TableHead>Subscription</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="w-[80px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{customers.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
											No customers found
										</TableCell>
									</TableRow>
								) : (
									customers.map((customer) => (
										<TableRow key={customer.id} className="cursor-pointer" onClick={() => handleViewCustomer(customer)}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-9 w-9">
														<AvatarImage src={customer.avatar} alt={customer.name} />
														<AvatarFallback>
															{customer.name
																.split(" ")
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-medium">{customer.name}</p>
														<p className="text-sm text-muted-foreground">{customer.email}</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1 text-sm text-muted-foreground">
													<MapPin className="h-3 w-3" />
													{customer.location}
												</div>
											</TableCell>
											<TableCell className="font-medium">{customer.totalBookings}</TableCell>
											<TableCell className="font-medium">€{customer.totalSpent.toFixed(2)}</TableCell>
											<TableCell>
												{customer.subscription.active ? (
													<Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
														{customer.subscription.plan}
													</Badge>
												) : (
													<span className="text-sm text-muted-foreground">None</span>
												)}
											</TableCell>
											<TableCell>
												<Badge
													className={cn(
														customer.status === "active"
															? "bg-green-100 text-green-700"
															: "bg-red-100 text-red-700",
													)}
												>
													{customer.status === "active" ? "Active" : "Suspended"}
												</Badge>
											</TableCell>
											<TableCell>
												<Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewCustomer(customer); }}>
													View
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between pt-4">
							<p className="text-sm text-muted-foreground">
								Page {page} of {totalPages}
							</p>
							<div className="flex gap-2">
								<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
									Previous
								</Button>
								<Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
									Next
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Customer Details Dialog */}
			<Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
				<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
					{selectedCustomer && (
						<>
							<DialogHeader>
								<div className="flex items-center gap-3 pr-6">
									<DialogTitle>Customer Details</DialogTitle>
									<Badge
										className={cn(
											selectedCustomer.status === "active"
												? "bg-green-100 text-green-700"
												: "bg-red-100 text-red-700",
										)}
									>
										{selectedCustomer.status === "active" ? "Active" : "Suspended"}
									</Badge>
								</div>
								<DialogDescription>
									Customer since {format(new Date(selectedCustomer.registeredAt), "MMMM yyyy")}
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4">
								{/* Profile */}
								<div className="flex items-center gap-4">
									<Avatar className="h-14 w-14">
										<AvatarImage src={selectedCustomer.avatar} alt={selectedCustomer.name} />
										<AvatarFallback className="text-lg">
											{selectedCustomer.name
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-lg font-semibold">{selectedCustomer.name}</p>
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span className="flex items-center gap-1">
												<Mail className="h-3 w-3" />
												{selectedCustomer.email}
											</span>
										</div>
										<div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
											<span className="flex items-center gap-1">
												<Phone className="h-3 w-3" />
												{selectedCustomer.phone}
											</span>
											<span className="flex items-center gap-1">
												<MapPin className="h-3 w-3" />
												{selectedCustomer.location}
											</span>
										</div>
									</div>
								</div>

								{/* Stats */}
								<div className="grid grid-cols-3 gap-3">
									<div className="rounded-lg border p-3 text-center">
										<p className="text-xl font-bold">{selectedCustomer.totalBookings}</p>
										<p className="text-xs text-muted-foreground">Bookings</p>
									</div>
									<div className="rounded-lg border p-3 text-center">
										<p className="text-xl font-bold">€{selectedCustomer.totalSpent.toFixed(2)}</p>
										<p className="text-xs text-muted-foreground">Total Spent</p>
									</div>
									<div className="rounded-lg border p-3 text-center">
										<p className="text-xl font-bold">{selectedCustomer.vehicles.length}</p>
										<p className="text-xs text-muted-foreground">Vehicles</p>
									</div>
								</div>

								{/* Vehicles */}
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<Car className="h-4 w-4" />
											Vehicles
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										{selectedCustomer.vehicles.map((v) => (
											<div key={v.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
												<span className="font-medium">
													{v.year} {v.make} {v.model}
												</span>
												<span className="text-muted-foreground">
													{v.color} • {v.plateNumber}
												</span>
											</div>
										))}
									</CardContent>
								</Card>

								{/* Subscription */}
								{selectedCustomer.subscription.active && (
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm flex items-center gap-2">
												<CreditCard className="h-4 w-4" />
												Subscription
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-1 text-sm">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Plan</span>
												<Badge variant="outline">{selectedCustomer.subscription.plan}</Badge>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Price</span>
												<span>€{selectedCustomer.subscription.price}/mo</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Washes Remaining</span>
												<span className="font-medium">{selectedCustomer.subscription.washesRemaining}</span>
											</div>
											{selectedCustomer.subscription.renewalDate && (
												<div className="flex justify-between">
													<span className="text-muted-foreground">Renewal</span>
													<span>{format(new Date(selectedCustomer.subscription.renewalDate), "MMM d, yyyy")}</span>
												</div>
											)}
										</CardContent>
									</Card>
								)}

								{/* Last Active */}
								<div className="text-xs text-muted-foreground text-center pt-2 border-t">
									Last active: {format(new Date(selectedCustomer.lastActiveAt), "MMM d, yyyy 'at' h:mm a")}
								</div>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
