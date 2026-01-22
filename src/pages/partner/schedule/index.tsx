import {
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Clock,
	MapPin,
	Plus,
	Settings,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Checkbox } from "@/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Slider } from "@/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { cn } from "@/utils";

// Types
interface Booking {
	id: string;
	time: string;
	customer: string;
	service: string;
	status: "pending" | "confirmed" | "in_progress" | "completed";
}

interface WorkingHours {
	day: string;
	open: string;
	close: string;
	isClosed: boolean;
}

interface BlockedDate {
	id: string;
	date: string;
	reason: string;
}

// Time options
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
	const hour = Math.floor(i / 2);
	const minute = i % 2 === 0 ? "00" : "30";
	return `${hour.toString().padStart(2, "0")}:${minute}`;
});

// Mock bookings data
const generateMockBookings = () => {
	const bookings: Record<string, Booking[]> = {};
	const statuses: Booking["status"][] = ["pending", "confirmed", "in_progress", "completed"];
	const services = ["Basic Wash", "Premium Detail", "Interior Clean", "Full Detail"];
	const customers = ["John Smith", "Sarah Johnson", "Mike Brown", "Emily Davis", "James Wilson"];

	// Generate bookings for current month
	const today = new Date();
	const year = today.getFullYear();
	const month = today.getMonth();

	for (let day = 1; day <= 28; day++) {
		const date = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
		const numBookings = Math.floor(Math.random() * 5);

		if (numBookings > 0) {
			bookings[date] = [];
			for (let i = 0; i < numBookings; i++) {
				const hour = 8 + Math.floor(Math.random() * 10);
				bookings[date].push({
					id: `${date}-${i}`,
					time: `${hour.toString().padStart(2, "0")}:${Math.random() > 0.5 ? "00" : "30"}`,
					customer: customers[Math.floor(Math.random() * customers.length)],
					service: services[Math.floor(Math.random() * services.length)],
					status: statuses[Math.floor(Math.random() * statuses.length)],
				});
			}
			bookings[date].sort((a, b) => a.time.localeCompare(b.time));
		}
	}

	return bookings;
};

// Initial working hours
const initialWorkingHours: WorkingHours[] = [
	{ day: "Monday", open: "08:00", close: "18:00", isClosed: false },
	{ day: "Tuesday", open: "08:00", close: "18:00", isClosed: false },
	{ day: "Wednesday", open: "08:00", close: "18:00", isClosed: false },
	{ day: "Thursday", open: "08:00", close: "18:00", isClosed: false },
	{ day: "Friday", open: "08:00", close: "18:00", isClosed: false },
	{ day: "Saturday", open: "09:00", close: "14:00", isClosed: false },
	{ day: "Sunday", open: "00:00", close: "00:00", isClosed: true },
];

// Status colors for calendar
const statusColors: Record<Booking["status"], string> = {
	pending: "bg-yellow-500",
	confirmed: "bg-green-500",
	in_progress: "bg-blue-500",
	completed: "bg-gray-400",
};

const statusLabels: Record<Booking["status"], string> = {
	pending: "Pending",
	confirmed: "Confirmed",
	in_progress: "In Progress",
	completed: "Completed",
};

export default function PartnerSchedulePage() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [bookings] = useState<Record<string, Booking[]>>(generateMockBookings);
	const [workingHours, setWorkingHours] = useState<WorkingHours[]>(initialWorkingHours);
	const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([
		{ id: "1", date: "2024-12-25", reason: "Christmas Day" },
		{ id: "2", date: "2024-12-26", reason: "Boxing Day" },
	]);
	const [bookingCapacity, setBookingCapacity] = useState(4);
	const [slotDuration, setSlotDuration] = useState(30);
	const [serviceRadius, setServiceRadius] = useState(15);
	const [blockDateDialogOpen, setBlockDateDialogOpen] = useState(false);
	const [newBlockDate, setNewBlockDate] = useState({ date: "", reason: "" });

	// Calendar navigation
	const goToPreviousMonth = () => {
		setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
	};

	const goToNextMonth = () => {
		setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
	};

	const goToToday = () => {
		setCurrentDate(new Date());
	};

	// Get calendar days
	const getCalendarDays = () => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

		const days: (number | null)[] = [];

		// Add empty slots for days before the first day
		for (let i = 0; i < startDayOfWeek; i++) {
			days.push(null);
		}

		// Add days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(day);
		}

		return days;
	};

	const formatDateKey = (day: number) => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth() + 1;
		return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
	};

	const getBookingsForDay = (day: number) => {
		const dateKey = formatDateKey(day);
		return bookings[dateKey] || [];
	};

	const isToday = (day: number) => {
		const today = new Date();
		return (
			day === today.getDate() &&
			currentDate.getMonth() === today.getMonth() &&
			currentDate.getFullYear() === today.getFullYear()
		);
	};

	const isBlockedDate = (day: number) => {
		const dateKey = formatDateKey(day);
		return blockedDates.some((bd) => bd.date === dateKey);
	};

	// Working hours handlers
	const handleWorkingHoursChange = (
		dayIndex: number,
		field: "open" | "close" | "isClosed",
		value: string | boolean,
	) => {
		setWorkingHours((prev) => prev.map((wh, i) => (i === dayIndex ? { ...wh, [field]: value } : wh)));
	};

	// Block date handlers
	const handleAddBlockDate = () => {
		if (newBlockDate.date && newBlockDate.reason) {
			setBlockedDates((prev) => [
				...prev,
				{ id: `${Date.now()}`, date: newBlockDate.date, reason: newBlockDate.reason },
			]);
			setNewBlockDate({ date: "", reason: "" });
			setBlockDateDialogOpen(false);
			toast.success("Date blocked successfully");
		}
	};

	const handleRemoveBlockDate = (id: string) => {
		setBlockedDates((prev) => prev.filter((bd) => bd.id !== id));
		toast.success("Blocked date removed");
	};

	const handleSaveSettings = () => {
		toast.success("Settings saved successfully");
	};

	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold">Calendar & Availability</h1>
				<p className="text-muted-foreground">Manage your schedule and working hours</p>
			</div>

			<Tabs defaultValue="calendar" className="space-y-6">
				<TabsList>
					<TabsTrigger value="calendar" className="gap-2">
						<CalendarIcon className="h-4 w-4" />
						Calendar
					</TabsTrigger>
					<TabsTrigger value="settings" className="gap-2">
						<Settings className="h-4 w-4" />
						Settings
					</TabsTrigger>
				</TabsList>

				{/* Calendar Tab */}
				<TabsContent value="calendar" className="space-y-6">
					<div className="grid gap-6 lg:grid-cols-3">
						{/* Calendar */}
						<Card className="lg:col-span-2">
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<div className="flex items-center gap-4">
									<Button variant="outline" size="icon" onClick={goToPreviousMonth}>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<h2 className="text-lg font-semibold">
										{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
									</h2>
									<Button variant="outline" size="icon" onClick={goToNextMonth}>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
								<Button variant="outline" size="sm" onClick={goToToday}>
									Today
								</Button>
							</CardHeader>
							<CardContent>
								{/* Legend */}
								<div className="flex flex-wrap gap-4 mb-4 text-sm">
									{Object.entries(statusColors).map(([status, color]) => (
										<div key={status} className="flex items-center gap-2">
											<div className={cn("h-3 w-3 rounded-full", color)} />
											<span>{statusLabels[status as Booking["status"]]}</span>
										</div>
									))}
								</div>

								{/* Calendar Grid */}
								<div className="grid grid-cols-7 gap-1">
									{/* Day headers */}
									{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
										<div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
											{day}
										</div>
									))}

									{/* Calendar days */}
									{getCalendarDays().map((day, index) => {
										if (day === null) {
											return <div key={`empty-start-${index}`} className="p-2" />;
										}

										const dayBookings = getBookingsForDay(day);
										const blocked = isBlockedDate(day);
										const dateKey = formatDateKey(day);

										return (
											<div
												key={day}
												className={cn(
													"min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors",
													isToday(day) && "border-primary border-2",
													blocked && "bg-red-50 dark:bg-red-950",
													selectedDate === dateKey && "ring-2 ring-primary",
													"hover:bg-muted/50",
												)}
												onClick={() => setSelectedDate(dateKey)}
												onKeyDown={(e) => e.key === "Enter" && setSelectedDate(dateKey)}
												role="button"
												tabIndex={0}
											>
												<div className="flex items-center justify-between mb-1">
													<span
														className={cn(
															"text-sm font-medium",
															isToday(day) && "text-primary",
															blocked && "text-red-500",
														)}
													>
														{day}
													</span>
													{blocked && <X className="h-3 w-3 text-red-500" />}
												</div>
												<div className="space-y-0.5">
													{dayBookings.slice(0, 3).map((booking) => (
														<div
															key={booking.id}
															className={cn("h-1.5 rounded-full", statusColors[booking.status])}
															title={`${booking.time} - ${booking.customer}`}
														/>
													))}
													{dayBookings.length > 3 && (
														<p className="text-xs text-muted-foreground">+{dayBookings.length - 3} more</p>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>

						{/* Day Details Sidebar */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									{selectedDate
										? new Date(selectedDate).toLocaleDateString("en-US", {
												weekday: "long",
												year: "numeric",
												month: "long",
												day: "numeric",
											})
										: "Select a date"}
								</CardTitle>
								<CardDescription>
									{selectedDate && bookings[selectedDate] ? `${bookings[selectedDate].length} bookings` : "No bookings"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{selectedDate && bookings[selectedDate] ? (
									<div className="space-y-3">
										{bookings[selectedDate].map((booking) => (
											<div key={booking.id} className="flex items-center gap-3 p-3 rounded-lg border">
												<div className={cn("h-10 w-1 rounded-full", statusColors[booking.status])} />
												<div className="flex-1">
													<p className="font-medium">{booking.customer}</p>
													<p className="text-sm text-muted-foreground">
														{booking.time} • {booking.service}
													</p>
												</div>
												<Badge
													variant="outline"
													className={cn(
														"text-xs",
														booking.status === "pending" && "border-yellow-500 text-yellow-600",
														booking.status === "confirmed" && "border-green-500 text-green-600",
														booking.status === "in_progress" && "border-blue-500 text-blue-600",
														booking.status === "completed" && "border-gray-400 text-gray-500",
													)}
												>
													{statusLabels[booking.status]}
												</Badge>
											</div>
										))}
									</div>
								) : selectedDate ? (
									<div className="text-center py-8 text-muted-foreground">
										<CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p>No bookings for this day</p>
									</div>
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p>Click on a date to view bookings</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Settings Tab */}
				<TabsContent value="settings" className="space-y-6">
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Working Hours */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Clock className="h-5 w-5" />
									Working Hours
								</CardTitle>
								<CardDescription>Set your business hours for each day</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{workingHours.map((wh, index) => (
									<div key={wh.day} className="flex items-center gap-4">
										<div className="w-28 font-medium">{wh.day}</div>
										<Select
											value={wh.open}
											onValueChange={(value) => handleWorkingHoursChange(index, "open", value)}
											disabled={wh.isClosed}
										>
											<SelectTrigger className="w-24">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{TIME_OPTIONS.map((time) => (
													<SelectItem key={time} value={time}>
														{time}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<span className="text-muted-foreground">to</span>
										<Select
											value={wh.close}
											onValueChange={(value) => handleWorkingHoursChange(index, "close", value)}
											disabled={wh.isClosed}
										>
											<SelectTrigger className="w-24">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{TIME_OPTIONS.map((time) => (
													<SelectItem key={time} value={time}>
														{time}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<div className="flex items-center gap-2">
											<Checkbox
												id={`closed-${wh.day}`}
												checked={wh.isClosed}
												onCheckedChange={(checked) => handleWorkingHoursChange(index, "isClosed", checked as boolean)}
											/>
											<Label htmlFor={`closed-${wh.day}`} className="text-sm cursor-pointer">
												Closed
											</Label>
										</div>
									</div>
								))}
							</CardContent>
						</Card>

						{/* Block Dates */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<X className="h-5 w-5" />
										Block Dates
									</CardTitle>
									<CardDescription>Days when your business is closed</CardDescription>
								</div>
								<Button size="sm" onClick={() => setBlockDateDialogOpen(true)}>
									<Plus className="h-4 w-4 mr-1" />
									Add Date
								</Button>
							</CardHeader>
							<CardContent>
								{blockedDates.length === 0 ? (
									<p className="text-center text-muted-foreground py-4">No blocked dates</p>
								) : (
									<div className="space-y-2">
										{blockedDates.map((bd) => (
											<div key={bd.id} className="flex items-center justify-between p-3 rounded-lg border">
												<div>
													<p className="font-medium">
														{new Date(bd.date).toLocaleDateString("en-US", {
															weekday: "short",
															year: "numeric",
															month: "short",
															day: "numeric",
														})}
													</p>
													<p className="text-sm text-muted-foreground">{bd.reason}</p>
												</div>
												<Button variant="ghost" size="icon" onClick={() => handleRemoveBlockDate(bd.id)}>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Booking Capacity */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<CalendarIcon className="h-5 w-5" />
									Booking Capacity
								</CardTitle>
								<CardDescription>Maximum bookings per time slot</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Bookings per slot</Label>
										<div className="flex items-center gap-4">
											<Slider
												value={[bookingCapacity]}
												onValueChange={([value]) => setBookingCapacity(value)}
												min={1}
												max={10}
												step={1}
												className="flex-1"
											/>
											<span className="w-12 text-center font-medium">{bookingCapacity}</span>
										</div>
										<p className="text-sm text-muted-foreground">
											You can accept up to {bookingCapacity} bookings per time slot
										</p>
									</div>

									<div className="space-y-2">
										<Label>Slot duration (minutes)</Label>
										<Select value={slotDuration.toString()} onValueChange={(value) => setSlotDuration(parseInt(value))}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="15">15 minutes</SelectItem>
												<SelectItem value="30">30 minutes</SelectItem>
												<SelectItem value="45">45 minutes</SelectItem>
												<SelectItem value="60">60 minutes</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Service Radius */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPin className="h-5 w-5" />
									Service Radius
								</CardTitle>
								<CardDescription>How far you travel for Pick & Clean service</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label>Maximum distance</Label>
										<span className="font-medium">{serviceRadius} km</span>
									</div>
									<Slider
										value={[serviceRadius]}
										onValueChange={([value]) => setServiceRadius(value)}
										min={0}
										max={50}
										step={1}
									/>
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>0 km</span>
										<span>50 km</span>
									</div>
								</div>

								{/* Map Preview Placeholder */}
								<div className="aspect-video rounded-lg bg-muted flex items-center justify-center border">
									<div className="text-center text-muted-foreground">
										<MapPin className="h-8 w-8 mx-auto mb-2" />
										<p className="text-sm">Map preview</p>
										<p className="text-xs">Service area: {serviceRadius} km radius</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Save Button */}
					<div className="flex justify-end">
						<Button onClick={handleSaveSettings} className="gap-2">
							Save Settings
						</Button>
					</div>
				</TabsContent>
			</Tabs>

			{/* Block Date Dialog */}
			<Dialog open={blockDateDialogOpen} onOpenChange={setBlockDateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Block a Date</DialogTitle>
						<DialogDescription>Add a date when your business will be closed</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="block-date">Date</Label>
							<Input
								id="block-date"
								type="date"
								value={newBlockDate.date}
								onChange={(e) => setNewBlockDate((prev) => ({ ...prev, date: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="block-reason">Reason</Label>
							<Input
								id="block-reason"
								placeholder="e.g., Christmas Day, Maintenance"
								value={newBlockDate.reason}
								onChange={(e) => setNewBlockDate((prev) => ({ ...prev, reason: e.target.value }))}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setBlockDateDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleAddBlockDate} disabled={!newBlockDate.date || !newBlockDate.reason}>
							Block Date
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
