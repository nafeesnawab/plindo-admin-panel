import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import customerService, { type Customer } from "@/api/services/customerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/table";
import { Textarea } from "@/ui/textarea";
import { format } from "date-fns";
import { Eye, Pause, Play, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CustomersPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	const [suspendReason, setSuspendReason] = useState("");
	const [showSuspendDialog, setShowSuspendDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showReactivateDialog, setShowReactivateDialog] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["customers", page, search, statusFilter],
		queryFn: () =>
			customerService.getCustomers({
				page,
				limit: 10,
				search: search || undefined,
				status: statusFilter || undefined,
			}),
	});

	const suspendMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) =>
			customerService.suspendCustomer(id, reason),
		onSuccess: () => {
			toast.success("Customer suspended");
			queryClient.invalidateQueries({ queryKey: ["customers"] });
			setShowSuspendDialog(false);
			setSelectedCustomer(null);
			setSuspendReason("");
		},
		onError: () => {
			toast.error("Failed to suspend customer");
		},
	});

	const reactivateMutation = useMutation({
		mutationFn: (id: string) => customerService.reactivateCustomer(id),
		onSuccess: () => {
			toast.success("Customer reactivated");
			queryClient.invalidateQueries({ queryKey: ["customers"] });
			setShowReactivateDialog(false);
			setSelectedCustomer(null);
		},
		onError: () => {
			toast.error("Failed to reactivate customer");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => customerService.deleteCustomer(id),
		onSuccess: () => {
			toast.success("Customer deleted");
			queryClient.invalidateQueries({ queryKey: ["customers"] });
			setShowDeleteDialog(false);
			setSelectedCustomer(null);
		},
		onError: () => {
			toast.error("Failed to delete customer");
		},
	});

	const handleSearch = () => {
		setSearch(searchInput);
		setPage(1);
	};

	const handleSuspend = () => {
		if (selectedCustomer && suspendReason) {
			suspendMutation.mutate({ id: selectedCustomer.id, reason: suspendReason });
		}
	};

	const handleReactivate = () => {
		if (selectedCustomer) {
			reactivateMutation.mutate(selectedCustomer.id);
		}
	};

	const handleDelete = () => {
		if (selectedCustomer) {
			deleteMutation.mutate(selectedCustomer.id);
		}
	};

	const openSuspendDialog = (customer: Customer) => {
		setSelectedCustomer(customer);
		setShowSuspendDialog(true);
	};

	const openReactivateDialog = (customer: Customer) => {
		setSelectedCustomer(customer);
		setShowReactivateDialog(true);
	};

	const openDeleteDialog = (customer: Customer) => {
		setSelectedCustomer(customer);
		setShowDeleteDialog(true);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-8 w-48" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>All Customers</span>
						<Badge variant="secondary" className="text-lg">
							{data?.total || 0} customers
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-4 mb-6">
						<div className="flex gap-2 flex-1 min-w-[200px]">
							<Input
								placeholder="Search by name, email, or phone..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								className="max-w-sm"
							/>
							<Button variant="outline" size="icon" onClick={handleSearch}>
								<Search className="h-4 w-4" />
							</Button>
						</div>
						<Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="suspended">Suspended</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{data?.items.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No customers found
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Customer</TableHead>
									<TableHead>Contact</TableHead>
									<TableHead>Registered</TableHead>
									<TableHead>Bookings</TableHead>
									<TableHead>Total Spent</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.items.map((customer) => (
									<TableRow key={customer.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-10 w-10">
													<AvatarImage src={customer.avatar} alt={customer.name} />
													<AvatarFallback className="bg-primary/10 text-primary text-xs">
														{customer.name.split(" ").map((n) => n[0]).join("")}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="font-medium">{customer.name}</p>
													<p className="text-xs text-muted-foreground">{customer.location}</p>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												<p>{customer.email}</p>
												<p className="text-muted-foreground">{customer.phone}</p>
											</div>
										</TableCell>
										<TableCell>
											{format(new Date(customer.registeredAt), "MMM dd, yyyy")}
										</TableCell>
										<TableCell>{customer.totalBookings}</TableCell>
										<TableCell>€{customer.totalSpent.toFixed(2)}</TableCell>
										<TableCell>
											{customer.status === "active" ? (
												<Badge variant="secondary" className="bg-green-500/10 text-green-600">
													Active
												</Badge>
											) : (
												<Badge variant="secondary" className="bg-red-500/10 text-red-600">
													Suspended
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => navigate(`/customers/${customer.id}`)}
												>
													<Eye className="h-4 w-4" />
												</Button>
												{customer.status === "active" ? (
													<Button
														variant="ghost"
														size="icon"
														className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
														onClick={() => openSuspendDialog(customer)}
													>
														<Pause className="h-4 w-4" />
													</Button>
												) : (
													<Button
														variant="ghost"
														size="icon"
														className="text-green-600 hover:text-green-700 hover:bg-green-50"
														onClick={() => openReactivateDialog(customer)}
													>
														<Play className="h-4 w-4" />
													</Button>
												)}
												<Button
													variant="ghost"
													size="icon"
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
													onClick={() => openDeleteDialog(customer)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					{data && data.totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 mt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {page} of {data.totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Suspend Customer</DialogTitle>
						<DialogDescription>
							Please provide a reason for suspending {selectedCustomer?.name}'s account.
						</DialogDescription>
					</DialogHeader>
					<Textarea
						placeholder="Enter suspension reason..."
						value={suspendReason}
						onChange={(e) => setSuspendReason(e.target.value)}
						rows={4}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleSuspend}
							disabled={!suspendReason || suspendMutation.isPending}
						>
							Suspend
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reactivate Customer</DialogTitle>
						<DialogDescription>
							Are you sure you want to reactivate {selectedCustomer?.name}'s account?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowReactivateDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleReactivate}
							disabled={reactivateMutation.isPending}
						>
							Reactivate
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Customer</DialogTitle>
						<DialogDescription>
							Are you sure you want to permanently delete {selectedCustomer?.name}'s account? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
