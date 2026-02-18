import { useQuery } from "@tanstack/react-query";
import { Pagination, Tabs } from "antd";
import { format } from "date-fns";
import { AlertTriangle, Eye, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import bookingService from "@/api/services/bookingService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
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
	const [activeTab, setActiveTab] = useState("bookings");

	const [bookingPage, setBookingPage] = useState(1);
	const [searchVal, setSearchVal] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");

	const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
		queryKey: ["bookings", bookingPage, searchVal, statusFilter],
		queryFn: () =>
			bookingService.getBookings({
				page: bookingPage,
				limit: 10,
				search: searchVal || undefined,
				status: statusFilter || undefined,
			}),
	});

	const handleSearch = () => {
		setSearchVal(searchInput);
		setBookingPage(1);
	};

	const renderSkeleton = () => (
		<div className="space-y-4">
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} className="h-16 w-full" />
			))}
		</div>
	);

	const renderBookingsTab = () => {
		if (bookingsLoading) return renderSkeleton();
		return (
			<div className="flex-1 min-h-0 flex flex-col">
				<div className="shrink-0 flex flex-wrap gap-4 mb-4">
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
							setBookingPage(1);
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
				{bookingsData?.items.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">No bookings found</div>
				) : (
					<>
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
						</Table>
						<div className="flex-1 min-h-0 overflow-auto">
							<Table>
								<TableBody>
									{bookingsData?.items.map((booking) => (
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
											<TableCell>EUR{booking.payment.amount.toFixed(2)}</TableCell>
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
						</div>
					</>
				)}
				{bookingsData && bookingsData.total > 10 && (
					<div className="shrink-0 flex justify-center py-3 border-t">
						<Pagination
							current={bookingPage}
							total={bookingsData.total}
							pageSize={10}
							onChange={(p) => setBookingPage(p)}
							showSizeChanger={false}
							showTotal={(total) => `Total ${total} bookings`}
						/>
					</div>
				)}
			</div>
		);
	};

	const tabItems = [
		{
			key: "bookings",
			label: `All Bookings (${bookingsData?.total || 0})`,
			children: renderBookingsTab(),
		},
	];

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardContent className="pt-4 flex-1 min-h-0 flex flex-col">
					<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="ant-tabs-flex-fill" />
				</CardContent>
			</Card>
		</div>
	);
}
