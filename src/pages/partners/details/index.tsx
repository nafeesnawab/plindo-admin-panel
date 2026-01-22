import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
	ArrowLeft,
	Building2,
	Calendar,
	CheckCircle,
	DollarSign,
	Mail,
	MapPin,
	Phone,
	Star,
	TrendingUp,
	User,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import partnerService from "@/api/services/partnerService";
import { Chart } from "@/components/chart";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Separator } from "@/ui/separator";
import { Skeleton } from "@/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

export default function PartnerDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const { data: partner, isLoading } = useQuery({
		queryKey: ["partner-details", id],
		queryFn: () => partnerService.getPartnerDetails(id!),
		enabled: !!id,
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

	if (!partner) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">Partner not found</p>
				<Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
					Go Back
				</Button>
			</div>
		);
	}

	const statusColors: Record<string, string> = {
		pending: "bg-yellow-500/10 text-yellow-600",
		active: "bg-green-500/10 text-green-600",
		suspended: "bg-red-500/10 text-red-600",
	};

	const earningsChartOptions: ApexCharts.ApexOptions = {
		chart: { type: "bar", toolbar: { show: false } },
		xaxis: { categories: partner.earningsHistory.map((e) => e.month) },
		colors: ["#10b981"],
		plotOptions: { bar: { borderRadius: 4 } },
		dataLabels: { enabled: false },
		yaxis: { labels: { formatter: (v) => `€${v.toFixed(0)}` } },
	};

	const earningsSeries = [{ name: "Earnings", data: partner.earningsHistory.map((e) => e.earnings) }];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<h1 className="text-2xl font-bold">{partner.businessName}</h1>
				<Badge className={statusColors[partner.status]}>
					{partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
				</Badge>
				{partner.isVerified && (
					<Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
						<CheckCircle className="h-3 w-3 mr-1" />
						Verified
					</Badge>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>Business Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-4">
							<Avatar className="h-16 w-16">
								<AvatarFallback className="bg-primary/10 text-primary text-lg">
									{partner.businessName
										.split(" ")
										.slice(0, 2)
										.map((n) => n[0])
										.join("")}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-semibold text-lg">{partner.businessName}</p>
								<p className="text-sm text-muted-foreground">License: {partner.businessLicense}</p>
							</div>
						</div>

						<Separator />

						<div className="space-y-3">
							<div className="flex items-center gap-3 text-sm">
								<User className="h-4 w-4 text-muted-foreground" />
								<span>{partner.ownerName}</span>
							</div>
							<div className="flex items-center gap-3 text-sm">
								<Mail className="h-4 w-4 text-muted-foreground" />
								<span>{partner.email}</span>
							</div>
							<div className="flex items-center gap-3 text-sm">
								<Phone className="h-4 w-4 text-muted-foreground" />
								<span>{partner.phone}</span>
							</div>
							<div className="flex items-center gap-3 text-sm">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span>{partner.address}</span>
							</div>
							<div className="flex items-center gap-3 text-sm">
								<Building2 className="h-4 w-4 text-muted-foreground" />
								<span>{partner.location}</span>
							</div>
							<div className="flex items-center gap-3 text-sm">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span>Joined {format(new Date(partner.createdAt), "MMM dd, yyyy")}</span>
							</div>
						</div>

						<Separator />

						<div>
							<p className="text-sm font-medium mb-2">Working Hours</p>
							<div className="space-y-1 text-sm">
								{Object.entries(partner.workingHours).map(([day, hours]) => (
									<div key={day} className="flex justify-between">
										<span className="capitalize text-muted-foreground">{day}</span>
										<span>
											{hours.open} - {hours.close}
										</span>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="lg:col-span-2 space-y-6">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center gap-2">
									<Star className="h-5 w-5 text-yellow-500" />
									<span className="text-2xl font-bold">{partner.rating?.toFixed(1) || "N/A"}</span>
								</div>
								<p className="text-xs text-muted-foreground mt-1">Average Rating</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5 text-green-500" />
									<span className="text-2xl font-bold">{partner.totalBookings.toLocaleString()}</span>
								</div>
								<p className="text-xs text-muted-foreground mt-1">Total Bookings</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center gap-2">
									<CheckCircle className="h-5 w-5 text-blue-500" />
									<span className="text-2xl font-bold">{partner.completionRate || 0}%</span>
								</div>
								<p className="text-xs text-muted-foreground mt-1">Completion Rate</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center gap-2">
									<DollarSign className="h-5 w-5 text-emerald-500" />
									<span className="text-2xl font-bold">€{partner.totalEarnings.toLocaleString()}</span>
								</div>
								<p className="text-xs text-muted-foreground mt-1">Total Earnings</p>
							</CardContent>
						</Card>
					</div>

					<Tabs defaultValue="services">
						<TabsList>
							<TabsTrigger value="services">Services & Pricing</TabsTrigger>
							<TabsTrigger value="reviews">Reviews ({partner.reviews.length})</TabsTrigger>
							<TabsTrigger value="earnings">Earnings History</TabsTrigger>
						</TabsList>

						<TabsContent value="services" className="mt-4">
							<Card>
								<CardContent className="pt-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{partner.services.map((service) => (
											<div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
												<span className="font-medium">{service.name}</span>
												<Badge variant="secondary">€{service.price.toFixed(2)}</Badge>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="reviews" className="mt-4">
							<Card>
								<CardContent className="pt-6 space-y-4">
									{partner.reviews.length === 0 ? (
										<p className="text-center text-muted-foreground py-4">No reviews yet</p>
									) : (
										partner.reviews.map((review) => (
											<div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center gap-2">
														<Avatar className="h-8 w-8">
															<AvatarFallback className="text-xs">
																{review.customerName
																	.split(" ")
																	.map((n) => n[0])
																	.join("")}
															</AvatarFallback>
														</Avatar>
														<span className="font-medium text-sm">{review.customerName}</span>
													</div>
													<div className="flex items-center gap-1">
														{Array.from({ length: 5 }).map((_, i) => (
															<Star
																key={i}
																className={`h-4 w-4 ${
																	i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
																}`}
															/>
														))}
													</div>
												</div>
												<p className="text-sm text-muted-foreground">{review.comment}</p>
												<p className="text-xs text-muted-foreground mt-1">
													{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
												</p>
											</div>
										))
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="earnings" className="mt-4">
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Earnings History (Last 6 Months)</CardTitle>
								</CardHeader>
								<CardContent>
									<Chart type="bar" height={300} options={earningsChartOptions} series={earningsSeries} />
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
