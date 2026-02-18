import { Loader2, Save } from "lucide-react";

import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";

import { CapacitySection } from "./components/capacity-section";
import { WeeklyCalendar } from "./components/weekly-calendar";
import { useSchedule } from "./hooks/use-schedule";

export default function PartnerSchedulePage() {
	const {
		schedule,
		capacityByCategory,
		bufferTime,
		hasChanges,
		isSaving,
		isLoading,
		handleDayChange,
		handleCapacityChange,
		handleBufferChange,
		handleSave,
	} = useSchedule();

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-14" />
				<Skeleton className="h-[600px]" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Schedule & Availability</h1>
					<p className="text-sm text-muted-foreground mt-1">Manage your working hours and service capacity</p>
				</div>
				<div className="flex items-center gap-2">
					{hasChanges && (
						<Badge
							variant="outline"
							className="h-8 px-3 text-xs inline-flex items-center bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800"
						>
							Unsaved changes
						</Badge>
					)}
					<Button size="sm" onClick={handleSave} disabled={isSaving || !hasChanges}>
						{isSaving ? (
							<>
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<Save className="h-3.5 w-3.5" />
								Save Changes
							</>
						)}
					</Button>
				</div>
			</div>

			<CapacitySection
				capacityByCategory={capacityByCategory}
				bufferTime={bufferTime}
				onCapacityChange={handleCapacityChange}
				onBufferChange={handleBufferChange}
			/>

			<WeeklyCalendar schedule={schedule} onDayChange={handleDayChange} />
		</div>
	);
}
