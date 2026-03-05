import { format } from "date-fns";
import { BarChart3, Download, FileSpreadsheet, Users } from "lucide-react";
import { useState } from "react";

import reportsService from "@/api/services/reportsService";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

interface ReportCard {
	title: string;
	description: string;
	icon: React.ElementType;
	color: string;
	bg: string;
	onExport: (from: string, to: string) => void;
}

export default function ReportsPage() {
	const [dates, setDates] = useState<Record<string, { from: string; to: string }>>({
		bookings: { from: "", to: "" },
		finance: { from: "", to: "" },
		partners: { from: "", to: "" },
		customers: { from: "", to: "" },
	});

	const today = format(new Date(), "yyyy-MM-dd");

	const updateDate = (key: string, field: "from" | "to", value: string) => {
		setDates((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
	};

	const reportCards: ReportCard[] = [
		{
			title: "Bookings Report",
			description: "All bookings with status, amounts, and service details",
			icon: FileSpreadsheet,
			color: "text-blue-600",
			bg: "bg-blue-500/10",
			onExport: (from, to) => reportsService.downloadBookings(from || undefined, to || undefined),
		},
		{
			title: "Finance Report",
			description: "Completed bookings with revenue, fees, and partner payouts",
			icon: BarChart3,
			color: "text-green-600",
			bg: "bg-green-500/10",
			onExport: (from, to) => reportsService.downloadFinance(from || undefined, to || undefined),
		},
		{
			title: "Partners Report",
			description: "All partners with ratings, earnings, and performance metrics",
			icon: Users,
			color: "text-orange-600",
			bg: "bg-orange-500/10",
			onExport: (from, to) => reportsService.downloadPartners(from || undefined, to || undefined),
		},
		{
			title: "Customers Report",
			description: "All customers with booking history and subscription status",
			icon: Users,
			color: "text-purple-600",
			bg: "bg-purple-500/10",
			onExport: (from, to) => reportsService.downloadCustomers(from || undefined, to || undefined),
		},
	];

	const keys = ["bookings", "finance", "partners", "customers"];

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-lg font-semibold">Downloadable Reports</h2>
				<p className="text-sm text-muted-foreground">Export CSV reports with optional date range filters</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{reportCards.map((card, i) => {
					const key = keys[i];
					const d = dates[key];
					return (
						<Card key={card.title}>
							<CardHeader>
								<div className="flex items-center gap-3">
									<div className={`p-2 rounded-lg ${card.bg}`}>
										<card.icon className={`h-5 w-5 ${card.color}`} />
									</div>
									<div>
										<CardTitle className="text-base">{card.title}</CardTitle>
										<CardDescription className="text-xs mt-0.5">{card.description}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex flex-col gap-3">
								<div className="grid grid-cols-2 gap-3">
									<div>
										<Label className="text-xs">From</Label>
										<Input
											type="date"
											max={today}
											value={d.from}
											onChange={(e) => updateDate(key, "from", e.target.value)}
										/>
									</div>
									<div>
										<Label className="text-xs">To</Label>
										<Input
											type="date"
											max={today}
											value={d.to}
											onChange={(e) => updateDate(key, "to", e.target.value)}
										/>
									</div>
								</div>
								<Button
									className="w-full"
									variant="outline"
									onClick={() => card.onExport(d.from, d.to)}
								>
									<Download className="h-4 w-4 mr-2" />
									Export CSV
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
