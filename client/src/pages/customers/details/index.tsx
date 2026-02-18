import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pagination } from "antd";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Calendar, Car, Crown, Mail, MapPin, Pause, Phone, Play, Star, Trash2, User } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import customerService from "@/api/services/customerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Separator } from "@/ui/separator";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
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

export default function CustomerDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [suspendReason, setSuspendReason] = useState("");
	const [notificationMessage, setNotificationMessage] = useState("");
	const [showSuspendDialog, setShowSuspendDialog] = useState(false);
	const [showReactivateDialog, setShowReactivateDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showNotifyDialog, setShowNotifyDialog] = useState(false);
	const [bookingPage, setBookingPage] = useState(1);
	const bookingPageSize = 5;

	const { data: customer, isLoading } = useQuery({
		queryKey: ["customer-details", id],
		queryFn: () => customerService.getCustomerDetails(id!),
		enabled: !!id,
	});

	const suspendMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) => customerService.suspendCustomer(id, reason),
		onSuccess: () => {
			toast.success("Customer suspended");
			queryClient.invalidateQueries({ queryKey: ["customer-details", id] });
			setShowSuspendDialog(false);
			setSuspendReason("");
		},
	});

	const reactivateMutation = useMutation({
		mutationFn: (id: string) => customerService.reactivateCustomer(id),
		onSuccess: () => {
			toast.success("Customer reactivated");
			queryClient.invalidateQueries({ queryKey: ["customer-details", id] });
			setShowReactivateDialog(false);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => customerService.deleteCustomer(id),
		onSuccess: () => {
			toast.success("Customer deleted");
			navigate("/customers");
		},
	});

	const notifyMutation = useMutation({
		mutationFn: ({ id, message }: { id: string; message: string }) => customerService.sendNotification(id, message),
		onSuccess: () => {
			toast.success("Notification sent");
			setShowNotifyDialog(false);
			setNotificationMessage("");
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-32" />
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Skeleton className="h-[400px] lg:col-span-1" />
					<Skeleton className="h-[400px] lg:col-span-2" />
				</div>
			</div>
		);
	}

	if (!customer) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">Customer not found</p>
				<Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
					Go Back
				</Button>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="shrink-0 flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<h1 className="text-2xl font-bold">{customer.name}</h1>
					<Badge
						className={customer.status === "active" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}
					>
						{customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
					</Badge>
				</div>
				<div className="flex items-center gap-2">
					{customer.status === "active" ? (
						<Button variant="outline" size="sm" className="text-yellow-600" onClick={() => setShowSuspendDialog(true)}>
							<Pause className="h-4 w-4 mr-2" />
							Suspend
						</Button>
					) : (
						<Button
							variant="outline"
							size="sm"
							className="text-green-600"
							onClick={() => setShowReactivateDialog(true)}
						>
							<Play className="h-4 w-4 mr-2" />
							Reactivate
						</Button>
					)}
					<Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
						<Trash2 className="h-4 w-4 mr-2" />
						Delete
					</Button>
				</div>
			</div>

			<div className="flex-1 min-h-0 overflow-auto">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Card className="lg:col-span-1">
						<CardHeader>
							<CardTitle>Personal Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-4">
								<Avatar className="h-16 w-16">
									<AvatarImage src={customer.avatar} alt={customer.name} />
									<AvatarFallback className="bg-primary/10 text-primary text-lg">
										{customer.name
											.split(" ")
											.map((n) => n[0])
											.join("")}
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-semibold text-lg">{customer.name}</p>
									<p className="text-sm text-muted-foreground">Customer</p>
								</div>
							</div>

							<Separator />

							<div className="space-y-3">
								<div className="flex items-center gap-3 text-sm">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<span>{customer.email}</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<span>{customer.phone}</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<MapPin className="h-4 w-4 text-muted-foreground" />
									<span>{customer.location}</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span>Joined {format(new Date(customer.registeredAt), "MMM dd, yyyy")}</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<User className="h-4 w-4 text-muted-foreground" />
									<span>Last active {formatDistanceToNow(new Date(customer.lastActiveAt), { addSuffix: true })}</span>
								</div>
							</div>

							<Separator />

							<div>
								<p className="text-sm font-medium mb-3">Subscription</p>
								{customer.subscription.active ? (
									<div className="p-3 border rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
										<div className="flex items-center gap-2 mb-2">
											<Crown className="h-4 w-4 text-amber-500" />
											<span className="font-medium">{customer.subscription.plan} Plan</span>
										</div>
										<p className="text-sm text-muted-foreground">€{customer.subscription.price}/month</p>
										<p className="text-sm text-muted-foreground">
											{customer.subscription.washesRemaining} washes remaining
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											Renews{" "}
											{customer.subscription.renewalDate &&
												format(new Date(customer.subscription.renewalDate), "MMM dd, yyyy")}
										</p>
									</div>
								) : (
									<p className="text-sm text-muted-foreground">No active subscription</p>
								)}
							</div>

							{customer.status === "suspended" && customer.suspensionReason && (
								<>
									<Separator />
									<div className="p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
										<p className="text-sm font-medium text-red-600 mb-1">Suspension Reason</p>
										<p className="text-sm text-red-600/80">{customer.suspensionReason}</p>
										<p className="text-xs text-red-600/60 mt-1">
											Suspended{" "}
											{customer.suspendedAt && formatDistanceToNow(new Date(customer.suspendedAt), { addSuffix: true })}
										</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					<div className="lg:col-span-2 space-y-6">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<Card>
								<CardContent className="pt-6">
									<span className="text-2xl font-bold">{customer.totalBookings}</span>
									<p className="text-xs text-muted-foreground mt-1">Total Bookings</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-6">
									<span className="text-2xl font-bold">€{customer.totalSpent.toFixed(2)}</span>
									<p className="text-xs text-muted-foreground mt-1">Total Spent</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-6">
									<span className="text-2xl font-bold">{customer.vehicles.length}</span>
									<p className="text-xs text-muted-foreground mt-1">Vehicles</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-6">
									<span className="text-2xl font-bold">{customer.paymentMethods.length}</span>
									<p className="text-xs text-muted-foreground mt-1">Payment Methods</p>
								</CardContent>
							</Card>
						</div>

						<Tabs defaultValue="bookings">
							<TabsList>
								<TabsTrigger value="bookings">Booking History</TabsTrigger>
								<TabsTrigger value="vehicles">Vehicles ({customer.vehicles.length})</TabsTrigger>
							</TabsList>

							<TabsContent value="bookings" className="mt-4">
								<Card className="flex flex-col max-h-[400px]">
									<CardContent className="pt-6 flex-1 min-h-0 flex flex-col">
										{customer.bookingHistory.length === 0 ? (
											<p className="text-center text-muted-foreground py-4">No bookings yet</p>
										) : (
											<>
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead>Service</TableHead>
															<TableHead>Partner</TableHead>
															<TableHead>Date</TableHead>
															<TableHead>Amount</TableHead>
															<TableHead>Rating</TableHead>
															<TableHead>Status</TableHead>
														</TableRow>
													</TableHeader>
												</Table>
												<div className="flex-1 min-h-0 overflow-auto">
													<Table>
														<TableBody>
															{customer.bookingHistory
																.slice((bookingPage - 1) * bookingPageSize, bookingPage * bookingPageSize)
																.map((booking) => (
																	<TableRow key={booking.id}>
																		<TableCell className="font-medium">{booking.service}</TableCell>
																		<TableCell>{booking.partnerName}</TableCell>
																		<TableCell>{format(new Date(booking.date), "MMM dd, yyyy")}</TableCell>
																		<TableCell>€{booking.amount.toFixed(2)}</TableCell>
																		<TableCell>
																			{booking.rating ? (
																				<div className="flex items-center gap-1">
																					<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
																					<span>{booking.rating}</span>
																				</div>
																			) : (
																				<span className="text-muted-foreground">-</span>
																			)}
																		</TableCell>
																		<TableCell>
																			<Badge className={statusColors[booking.status]}>
																				{statusLabels[booking.status]}
																			</Badge>
																		</TableCell>
																	</TableRow>
																))}
														</TableBody>
													</Table>
												</div>
												{customer.bookingHistory.length > bookingPageSize && (
													<div className="shrink-0 flex justify-center pt-4 border-t mt-4">
														<Pagination
															current={bookingPage}
															total={customer.bookingHistory.length}
															pageSize={bookingPageSize}
															onChange={setBookingPage}
															showSizeChanger={false}
														/>
													</div>
												)}
											</>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="vehicles" className="mt-4">
								<Card>
									<CardContent className="pt-6">
										{customer.vehicles.length === 0 ? (
											<p className="text-center text-muted-foreground py-4">No vehicles registered</p>
										) : (
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{customer.vehicles.map((vehicle) => (
													<div key={vehicle.id} className="p-4 border rounded-lg">
														<div className="flex items-center gap-3">
															<div className="p-2 bg-primary/10 rounded-lg">
																<Car className="h-5 w-5 text-primary" />
															</div>
															<div>
																<p className="font-medium">
																	{vehicle.make} {vehicle.model}
																</p>
																<p className="text-sm text-muted-foreground">
																	{vehicle.color} • {vehicle.year}
																</p>
															</div>
														</div>
														<div className="mt-3 pt-3 border-t">
															<p className="text-sm">
																<span className="text-muted-foreground">Plate: </span>
																<span className="font-mono font-medium">{vehicle.plateNumber}</span>
															</p>
														</div>
													</div>
												))}
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</div>

			<Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Suspend Customer</DialogTitle>
						<DialogDescription>Please provide a reason for suspending {customer.name}'s account.</DialogDescription>
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
							onClick={() => suspendMutation.mutate({ id: customer.id, reason: suspendReason })}
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
						<DialogDescription>Are you sure you want to reactivate {customer.name}'s account?</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowReactivateDialog(false)}>
							Cancel
						</Button>
						<Button onClick={() => reactivateMutation.mutate(customer.id)} disabled={reactivateMutation.isPending}>
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
							Are you sure you want to permanently delete {customer.name}'s account? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => deleteMutation.mutate(customer.id)}
							disabled={deleteMutation.isPending}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Send Notification</DialogTitle>
						<DialogDescription>Send a push notification to {customer.name}.</DialogDescription>
					</DialogHeader>
					<Textarea
						placeholder="Enter notification message..."
						value={notificationMessage}
						onChange={(e) => setNotificationMessage(e.target.value)}
						rows={4}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowNotifyDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => notifyMutation.mutate({ id: customer.id, message: notificationMessage })}
							disabled={!notificationMessage || notifyMutation.isPending}
						>
							Send
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
