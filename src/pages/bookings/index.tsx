import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pagination, Tabs } from "antd";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle, Eye, FileImage, FileVideo, RefreshCw, Scale, Search, UserX } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import bookingService, { type Booking } from "@/api/services/bookingService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Separator } from "@/ui/separator";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Textarea } from "@/ui/textarea";

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
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState("bookings");

	const [bookingPage, setBookingPage] = useState(1);
	const [disputePage, setDisputePage] = useState(1);
	const [searchVal, setSearchVal] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");

	const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
	const [showDetailsDialog, setShowDetailsDialog] = useState(false);
	const [showResolveDialog, setShowResolveDialog] = useState(false);
	const [resolution, setResolution] = useState({ action: "", notes: "", refundAmount: "" });

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

	const { data: disputesData, isLoading: disputesLoading } = useQuery({
		queryKey: ["disputes", disputePage],
		queryFn: () => bookingService.getDisputes({ page: disputePage, limit: 10 }),
	});

	const resolveMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: { action: string; notes: string; refundAmount?: number } }) =>
			bookingService.resolveDispute(id, data),
		onSuccess: () => {
			toast.success("Dispute resolved");
			queryClient.invalidateQueries({ queryKey: ["disputes"] });
			setShowResolveDialog(false);
			setSelectedBooking(null);
			setResolution({ action: "", notes: "", refundAmount: "" });
		},
		onError: () => toast.error("Failed to resolve dispute"),
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
					<div className="flex-1 min-h-0 overflow-auto">
						<Table>
							<TableHeader className="sticky top-0 bg-card z-10">
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

	const renderDisputesTab = () => {
		if (disputesLoading) return renderSkeleton();
		return (
			<div className="flex-1 min-h-0 flex flex-col">
				{disputesData?.items.length === 0 ? (
					<div className="text-center py-12">
						<CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
						<p className="text-lg font-medium">No disputes to review</p>
						<p className="text-muted-foreground">All disputes have been resolved</p>
					</div>
				) : (
					<div className="flex-1 min-h-0 overflow-auto">
						<Table>
							<TableHeader className="sticky top-0 bg-card z-10">
								<TableRow>
									<TableHead>Booking</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Partner</TableHead>
									<TableHead>Dispute Reason</TableHead>
									<TableHead>Evidence</TableHead>
									<TableHead>Filed</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{disputesData?.items.map((booking) => (
									<TableRow key={booking.id}>
										<TableCell>
											<div>
												<p className="font-mono text-sm">{booking.bookingNumber}</p>
												<p className="text-xs text-muted-foreground">EUR{booking.payment.amount.toFixed(2)}</p>
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
												<p>{booking.partner.businessName}</p>
												<p className="text-xs text-muted-foreground">{booking.partner.location}</p>
											</div>
										</TableCell>
										<TableCell>
											<p className="text-sm max-w-[200px] truncate">{booking.dispute?.reason}</p>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												{booking.dispute?.customerEvidence && (
													<div className="flex items-center gap-1">
														{booking.dispute.customerEvidence.filter((e) => e.type === "photo").length > 0 && (
															<Badge variant="outline" className="gap-1">
																<FileImage className="h-3 w-3" />
																{booking.dispute.customerEvidence.filter((e) => e.type === "photo").length}
															</Badge>
														)}
														{booking.dispute.customerEvidence.filter((e) => e.type === "video").length > 0 && (
															<Badge variant="outline" className="gap-1">
																<FileVideo className="h-3 w-3" />
																{booking.dispute.customerEvidence.filter((e) => e.type === "video").length}
															</Badge>
														)}
													</div>
												)}
												{booking.dispute?.partnerResponse && (
													<Badge variant="secondary" className="text-xs">
														Partner responded
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell>
											<span className="text-sm text-muted-foreground">
												{booking.dispute?.createdAt &&
													formatDistanceToNow(new Date(booking.dispute.createdAt), { addSuffix: true })}
											</span>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => {
														setSelectedBooking(booking);
														setShowDetailsDialog(true);
													}}
												>
													<Eye className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedBooking(booking);
														setResolution({ action: "", notes: "", refundAmount: booking.payment.amount.toString() });
														setShowResolveDialog(true);
													}}
												>
													<Scale className="h-4 w-4 mr-1" />
													Resolve
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
				{disputesData && disputesData.total > 10 && (
					<div className="shrink-0 flex justify-center py-3 border-t">
						<Pagination
							current={disputePage}
							total={disputesData.total}
							pageSize={10}
							onChange={(p) => setDisputePage(p)}
							showSizeChanger={false}
							showTotal={(total) => `Total ${total} disputes`}
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
		{
			key: "disputes",
			label: `Disputes (${disputesData?.total || 0})`,
			children: renderDisputesTab(),
		},
	];

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardContent className="pt-6 flex-1 min-h-0 flex flex-col">
					<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="ant-tabs-flex-fill" />
				</CardContent>
			</Card>

			<Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-orange-500" />
							Dispute Details
						</DialogTitle>
						<DialogDescription>Booking: {selectedBooking?.bookingNumber}</DialogDescription>
					</DialogHeader>
					{selectedBooking?.dispute && (
						<div className="space-y-4 max-h-[60vh] overflow-y-auto">
							<div className="grid grid-cols-2 gap-4">
								<div className="p-3 border rounded-lg">
									<p className="text-xs text-muted-foreground mb-1">Customer</p>
									<div className="flex items-center gap-2">
										<Avatar className="h-8 w-8">
											<AvatarImage src={selectedBooking.customer.avatar} />
											<AvatarFallback>
												{selectedBooking.customer.name
													.split(" ")
													.map((n) => n[0])
													.join("")}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm font-medium">{selectedBooking.customer.name}</p>
											<p className="text-xs text-muted-foreground">{selectedBooking.customer.email}</p>
										</div>
									</div>
								</div>
								<div className="p-3 border rounded-lg">
									<p className="text-xs text-muted-foreground mb-1">Partner</p>
									<p className="text-sm font-medium">{selectedBooking.partner.businessName}</p>
									<p className="text-xs text-muted-foreground">{selectedBooking.partner.location}</p>
								</div>
							</div>
							<div>
								<h4 className="font-medium mb-1">Dispute Reason</h4>
								<p className="text-sm text-muted-foreground">{selectedBooking.dispute.reason}</p>
							</div>
							<div>
								<h4 className="font-medium mb-1">Description</h4>
								<p className="text-sm text-muted-foreground">{selectedBooking.dispute.description}</p>
							</div>
							<div>
								<h4 className="font-medium mb-1">
									Customer Evidence ({selectedBooking.dispute.customerEvidence.length})
								</h4>
								<div className="grid grid-cols-3 gap-2">
									{selectedBooking.dispute.customerEvidence.map((evidence, i) => (
										<div key={i} className="border rounded-lg p-3 text-center bg-muted/50">
											{evidence.type === "photo" ? (
												<FileImage className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
											) : (
												<FileVideo className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
											)}
											<p className="text-xs text-muted-foreground capitalize">{evidence.type}</p>
											<p className="text-xs text-muted-foreground">{format(new Date(evidence.uploadedAt), "MMM dd")}</p>
										</div>
									))}
								</div>
							</div>
							{selectedBooking.dispute.partnerResponse && (
								<>
									<Separator />
									<div>
										<h4 className="font-medium mb-1">Partner Response</h4>
										<p className="text-sm text-muted-foreground">{selectedBooking.dispute.partnerResponse.response}</p>
										<p className="text-xs text-muted-foreground mt-1">
											Responded{" "}
											{formatDistanceToNow(new Date(selectedBooking.dispute.partnerResponse.respondedAt), {
												addSuffix: true,
											})}
										</p>
									</div>
									{selectedBooking.dispute.partnerResponse.evidence.length > 0 && (
										<div>
											<h4 className="font-medium mb-1">
												Partner Evidence ({selectedBooking.dispute.partnerResponse.evidence.length})
											</h4>
											<div className="grid grid-cols-3 gap-2">
												{selectedBooking.dispute.partnerResponse.evidence.map((evidence, i) => (
													<div key={i} className="border rounded-lg p-3 text-center bg-muted/50">
														{evidence.type === "photo" ? (
															<FileImage className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
														) : (
															<FileVideo className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
														)}
														<p className="text-xs text-muted-foreground capitalize">{evidence.type}</p>
													</div>
												))}
											</div>
										</div>
									)}
								</>
							)}
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
							Close
						</Button>
						<Button onClick={() => navigate(`/bookings/${selectedBooking?.id}`)}>View Full Booking</Button>
						<Button
							onClick={() => {
								setShowDetailsDialog(false);
								if (selectedBooking) {
									setResolution({ action: "", notes: "", refundAmount: selectedBooking.payment.amount.toString() });
									setShowResolveDialog(true);
								}
							}}
						>
							<Scale className="h-4 w-4 mr-2" />
							Resolve Dispute
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Resolve Dispute</DialogTitle>
						<DialogDescription>
							Choose how to resolve the dispute for booking {selectedBooking?.bookingNumber}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Resolution Action</Label>
							<Select
								value={resolution.action}
								onValueChange={(v) => setResolution((prev) => ({ ...prev, action: v }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select action" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="refund">
										<div className="flex items-center gap-2">
											<RefreshCw className="h-4 w-4" />
											Issue Full/Partial Refund
										</div>
									</SelectItem>
									<SelectItem value="dismiss">
										<div className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4" />
											Dismiss Dispute (No Action)
										</div>
									</SelectItem>
									<SelectItem value="suspend_partner">
										<div className="flex items-center gap-2">
											<UserX className="h-4 w-4" />
											Refund & Suspend Partner
										</div>
									</SelectItem>
									<SelectItem value="suspend_customer">
										<div className="flex items-center gap-2">
											<UserX className="h-4 w-4" />
											Dismiss & Suspend Customer
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{(resolution.action === "refund" || resolution.action === "suspend_partner") && (
							<div>
								<Label>Refund Amount (EUR)</Label>
								<Input
									type="number"
									placeholder="Enter refund amount"
									value={resolution.refundAmount}
									onChange={(e) => setResolution((prev) => ({ ...prev, refundAmount: e.target.value }))}
									max={selectedBooking?.payment.amount}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Maximum: EUR{selectedBooking?.payment.amount.toFixed(2)}
								</p>
							</div>
						)}
						<div>
							<Label>Resolution Notes</Label>
							<Textarea
								placeholder="Enter notes about the resolution..."
								value={resolution.notes}
								onChange={(e) => setResolution((prev) => ({ ...prev, notes: e.target.value }))}
								rows={4}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowResolveDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (selectedBooking && resolution.action && resolution.notes) {
									resolveMutation.mutate({
										id: selectedBooking.id,
										data: {
											action: resolution.action,
											notes: resolution.notes,
											refundAmount:
												resolution.action === "refund" ? Number.parseFloat(resolution.refundAmount) : undefined,
										},
									});
								}
							}}
							disabled={!resolution.action || !resolution.notes || resolveMutation.isPending}
						>
							Resolve Dispute
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
