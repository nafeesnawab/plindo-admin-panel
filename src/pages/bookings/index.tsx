import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Eye, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import bookingService from "@/api/services/bookingService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

const statusColors: Record<string, string> = {
	booked: "bg-blue-500/10 text-blue-600",
	in_progress: "bg-purple-500/10 text-purple-600",
	completed: "bg-green-500/10 text-green-600",
	picked: "bg-indigo-500/10 text-indigo-600",
	out_for_delivery: "bg-amber-500/10 text-amber-600",
	delivered: "bg-teal-500/10 text-teal-600",
	cancelled: "bg-red-500/10 text-red-600",
	rescheduled: "bg-orange-500/10 text-orange-600",
};

const statusLabels: Record<string, string> = {
	booked: "Booked",
	in_progress: "In Progress",
	completed: "Completed",
	picked: "Picked",
	out_for_delivery: "Out for Delivery",
	delivered: "Delivered",
	cancelled: "Cancelled",
	rescheduled: "Rescheduled",
};

export default function BookingsPage() {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");

	const { data, isLoading } = useQuery({
		queryKey: ["bookings", page, search, statusFilter],
		queryFn: () =>
			bookingService.getBookings({
				page,
				limit: 10,
				search: search || undefined,
				status: statusFilter || undefined,
			}),
	});

	const handleSearch = () => {
		setSearch(searchInput);
		setPage(1);
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
						<span>All Bookings</span>
						<Badge variant="secondary" className="text-lg">
							{data?.total || 0} bookings
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-4 mb-6">
						<div className="flex gap-2 flex-1 min-w-[200px]">
							<Input
								placeholder="Search by booking number, customer, or partner..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								className="max-w-md"
							/>
							<Button variant="outline" size="icon" onClick={handleSearch}>
								<Search className="h-4 w-4" />
							</Button>
						</div>
						<Select
							value={statusFilter}
							onValueChange={(v) => {
								setStatusFilter(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="booked">Booked</SelectItem>
								<SelectItem value="in_progress">In Progress</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="picked">Picked</SelectItem>
								<SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
								<SelectItem value="delivered">Delivered</SelectItem>
								<SelectItem value="cancelled">Cancelled</SelectItem>
								<SelectItem value="rescheduled">Rescheduled</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{data?.items.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">No bookings found</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Booking ID</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Partner</TableHead>
									<TableHead>Service</TableHead>
									<TableHead>Date/Time</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.items.map((booking) => (
									<TableRow key={booking.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<span className="font-mono text-sm">{booking.bookingNumber}</span>
												{booking.isDisputed && <AlertTriangle className="h-4 w-4 text-orange-500" />}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8">
													<AvatarImage src={booking.customer.avatar} alt={booking.customer.name} />
													<AvatarFallback className="bg-primary/10 text-primary text-xs">
														{booking.customer.name
															.split(" ")
															.map((n) => n[0])
															.join("")}
													</AvatarFallback>
												</Avatar>
												<span className="text-sm">{booking.customer.name}</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												<p className="font-medium">{booking.partner.businessName}</p>
												<p className="text-xs text-muted-foreground">{booking.partner.location}</p>
											</div>
										</TableCell>
										<TableCell>{booking.service.name}</TableCell>
										<TableCell>
											<div className="text-sm">
												<p>{format(new Date(booking.scheduledDate), "MMM dd, yyyy")}</p>
												<p className="text-xs text-muted-foreground">
													{format(new Date(booking.scheduledDate), "hh:mm a")}
												</p>
											</div>
										</TableCell>
										<TableCell>€{booking.payment.amount.toFixed(2)}</TableCell>
										<TableCell>
											<Badge className={statusColors[booking.status]}>{statusLabels[booking.status]}</Badge>
										</TableCell>
										<TableCell className="text-right">
											<Button variant="ghost" size="icon" onClick={() => navigate(`/bookings/${booking.id}`)}>
												<Eye className="h-4 w-4" />
											</Button>
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
		</>
	);
}
