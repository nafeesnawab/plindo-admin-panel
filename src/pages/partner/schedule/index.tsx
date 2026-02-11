import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Clock, Loader2, Minus, Plus, Save, Settings2, Sparkles, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import slotBookingService from "@/api/services/slotBookingService";
import type { DayAvailability, PartnerCapacity, ServiceCategory, WeeklyAvailability } from "@/types/booking";
import { SERVICE_CATEGORY_LABELS } from "@/types/booking";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Separator } from "@/ui/separator";
import { Skeleton } from "@/ui/skeleton";
import { Switch } from "@/ui/switch";

const PARTNER_ID = "demo-partner-1";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ============ CAPACITY CARD ============

function CapacityCard({
	category,
	count,
	icon,
	color,
	onChange,
}: {
	category: ServiceCategory;
	count: number;
	icon: React.ReactNode;
	color: string;
	onChange: (value: number) => void;
}) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
						<div>
							<p className="font-semibold">{SERVICE_CATEGORY_LABELS[category]}</p>
							<p className="text-sm text-muted-foreground">
								{count} {count === 1 ? "bay" : "bays"} available
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={() => onChange(Math.max(0, count - 1))}
							disabled={count <= 0}
						>
							<Minus className="h-4 w-4" />
						</Button>
						<span className="w-8 text-center text-lg font-bold">{count}</span>
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={() => onChange(Math.min(20, count + 1))}
							disabled={count >= 20}
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ============ DAY ROW ============

function DayRow({ day, onChange }: { day: DayAvailability; onChange: (updated: DayAvailability) => void }) {
	return (
		<div className="flex items-center gap-4 py-3">
			<div className="w-28 flex items-center gap-3">
				<Switch checked={day.isEnabled} onCheckedChange={(checked) => onChange({ ...day, isEnabled: checked })} />
				<span className={`text-sm font-medium ${day.isEnabled ? "" : "text-muted-foreground"}`}>{day.dayName}</span>
			</div>
			{day.isEnabled ? (
				<div className="flex items-center gap-2">
					<Input
						type="time"
						value={day.workStart}
						onChange={(e) => onChange({ ...day, workStart: e.target.value })}
						className="w-32 h-9"
					/>
					<span className="text-muted-foreground">to</span>
					<Input
						type="time"
						value={day.workEnd}
						onChange={(e) => onChange({ ...day, workEnd: e.target.value })}
						className="w-32 h-9"
					/>
				</div>
			) : (
				<span className="text-sm text-muted-foreground">Closed</span>
			)}
		</div>
	);
}

// ============ MAIN PAGE ============

export default function PartnerSchedulePage() {
	const queryClient = useQueryClient();
	const [hasChanges, setHasChanges] = useState(false);

	// Schedule state
	const [schedule, setSchedule] = useState<DayAvailability[]>(() =>
		DAY_NAMES.map((name, index) => ({
			dayOfWeek: index,
			dayName: name,
			isEnabled: index !== 0, // Sunday closed by default
			workStart: index === 6 ? "09:00" : "08:00",
			workEnd: index === 6 ? "14:00" : "18:00",
		})),
	);

	// Capacity state
	const [capacityByCategory, setCapacityByCategory] = useState<Record<ServiceCategory, number>>({
		wash: 5,
		detailing: 2,
		other: 0,
	});
	const [bufferTime, setBufferTime] = useState(15);

	// Fetch existing availability
	const { data: existingAvailability, isLoading: loadingAvailability } = useQuery({
		queryKey: ["partner-availability", PARTNER_ID],
		queryFn: () => slotBookingService.getWeeklyAvailability(PARTNER_ID),
	});

	// Fetch existing capacity
	const { data: existingCapacity, isLoading: loadingCapacity } = useQuery({
		queryKey: ["partner-capacity", PARTNER_ID],
		queryFn: () => slotBookingService.getPartnerCapacity(PARTNER_ID),
	});

	// Load existing data
	useEffect(() => {
		if (existingAvailability?.schedule) {
			setSchedule(existingAvailability.schedule);
			setBufferTime(existingAvailability.bufferTimeMinutes || 15);
		}
	}, [existingAvailability]);

	useEffect(() => {
		if (existingCapacity?.capacityByCategory) {
			setCapacityByCategory(existingCapacity.capacityByCategory);
		}
		if (existingCapacity?.bufferTimeMinutes) {
			setBufferTime(existingCapacity.bufferTimeMinutes);
		}
	}, [existingCapacity]);

	// Save mutations
	const saveAvailabilityMutation = useMutation({
		mutationFn: (data: Partial<WeeklyAvailability>) => slotBookingService.updateWeeklyAvailability(data, PARTNER_ID),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["partner-availability"] });
		},
	});

	const saveCapacityMutation = useMutation({
		mutationFn: (data: Partial<PartnerCapacity>) => slotBookingService.updatePartnerCapacity(data, PARTNER_ID),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["partner-capacity"] });
		},
	});

	const isSaving = saveAvailabilityMutation.isPending || saveCapacityMutation.isPending;

	// Handlers
	const handleDayChange = useCallback((updated: DayAvailability) => {
		setSchedule((prev) => prev.map((d) => (d.dayOfWeek === updated.dayOfWeek ? updated : d)));
		setHasChanges(true);
	}, []);

	const handleCapacityChange = useCallback((category: ServiceCategory, value: number) => {
		setCapacityByCategory((prev) => ({ ...prev, [category]: value }));
		setHasChanges(true);
	}, []);

	const handleBufferChange = useCallback((value: number) => {
		setBufferTime(value);
		setHasChanges(true);
	}, []);

	const handleSave = useCallback(async () => {
		try {
			await Promise.all([
				saveAvailabilityMutation.mutateAsync({
					partnerId: PARTNER_ID,
					schedule,
					bufferTimeMinutes: bufferTime,
					maxAdvanceBookingDays: 14,
				}),
				saveCapacityMutation.mutateAsync({
					partnerId: PARTNER_ID,
					capacityByCategory,
					bufferTimeMinutes: bufferTime,
				}),
			]);
			toast.success("Settings saved successfully");
			setHasChanges(false);
		} catch {
			toast.error("Failed to save settings");
		}
	}, [schedule, capacityByCategory, bufferTime, saveAvailabilityMutation, saveCapacityMutation]);

	const isLoading = loadingAvailability || loadingCapacity;

	if (isLoading) {
		return (
			<div className="space-y-6 max-w-3xl">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-40" />
				<Skeleton className="h-64" />
			</div>
		);
	}

	const totalBays = capacityByCategory.wash + capacityByCategory.detailing + capacityByCategory.other;
	const activeDays = schedule.filter((d) => d.isEnabled).length;

	return (
		<div className="space-y-6 max-w-3xl">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Schedule & Capacity</h1>
					<p className="text-muted-foreground">Set your working hours and service capacity</p>
				</div>
				<div className="flex items-center gap-3">
					{hasChanges && (
						<Badge variant="outline" className="text-orange-600 border-orange-300">
							Unsaved changes
						</Badge>
					)}
					<Button onClick={handleSave} disabled={isSaving || !hasChanges}>
						{isSaving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<Save className="mr-2 h-4 w-4" />
								Save Changes
							</>
						)}
					</Button>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-blue-100">
								<Settings2 className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<p className="text-2xl font-bold">{totalBays}</p>
								<p className="text-xs text-muted-foreground">Total bays</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-green-100">
								<Clock className="h-5 w-5 text-green-600" />
							</div>
							<div>
								<p className="text-2xl font-bold">{activeDays}</p>
								<p className="text-xs text-muted-foreground">Days open</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-purple-100">
								<Timer className="h-5 w-5 text-purple-600" />
							</div>
							<div>
								<p className="text-2xl font-bold">{bufferTime}m</p>
								<p className="text-xs text-muted-foreground">Buffer time</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Bay Capacity */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Bay Capacity</CardTitle>
					<CardDescription>How many vehicles can you service simultaneously in each category?</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<CapacityCard
						category="wash"
						count={capacityByCategory.wash}
						icon={<Car className="h-5 w-5 text-blue-600" />}
						color="bg-blue-100"
						onChange={(v) => handleCapacityChange("wash", v)}
					/>
					<CapacityCard
						category="detailing"
						count={capacityByCategory.detailing}
						icon={<Sparkles className="h-5 w-5 text-purple-600" />}
						color="bg-purple-100"
						onChange={(v) => handleCapacityChange("detailing", v)}
					/>

					<Separator />

					<div className="flex items-center justify-between">
						<div>
							<Label className="text-sm font-medium">Buffer Time Between Bookings</Label>
							<p className="text-xs text-muted-foreground mt-0.5">Cleanup/prep time between services on the same bay</p>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8"
								onClick={() => handleBufferChange(Math.max(0, bufferTime - 5))}
								disabled={bufferTime <= 0}
							>
								<Minus className="h-4 w-4" />
							</Button>
							<span className="w-12 text-center text-sm font-medium">{bufferTime} min</span>
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8"
								onClick={() => handleBufferChange(Math.min(60, bufferTime + 5))}
								disabled={bufferTime >= 60}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Working Hours */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Working Hours</CardTitle>
					<CardDescription>Set your operating hours for each day of the week</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="divide-y">
						{schedule.map((day) => (
							<DayRow key={day.dayOfWeek} day={day} onChange={handleDayChange} />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
