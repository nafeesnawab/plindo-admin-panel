import { toast } from "sonner";
import { CapacitySection } from "@/pages/partner/schedule/components/capacity-section";
import { WeeklyCalendar } from "@/pages/partner/schedule/components/weekly-calendar";
import { Button } from "@/ui/button";
import { usePartnerRegistration } from "../context/registration-context";

interface DaySchedule {
	dayOfWeek: number;
	dayName: string;
	isEnabled: boolean;
	timeBlocks: Array<{ start: string; end: string }>;
}

export function ScheduleCapacityStep() {
	const {
		schedule,
		capacityByCategory,
		bufferTime,
		setSchedule,
		setCapacityByCategory,
		setBufferTime,
		nextStep,
		prevStep,
	} = usePartnerRegistration();

	const handleDayChange = (updatedDay: DaySchedule) => {
		setSchedule(
			schedule.map((d) =>
				d.dayOfWeek === updatedDay.dayOfWeek ? updatedDay : d,
			),
		);
	};

	const handleCapacityChange = (category: string, value: number) => {
		setCapacityByCategory({ ...capacityByCategory, [category]: value });
	};

	const handleNext = () => {
		const hasEnabledDay = schedule.some(
			(d) => d.isEnabled && d.timeBlocks.length > 0,
		);
		if (!hasEnabledDay) {
			toast.error("Please enable at least one working day with a time slot.");
			return;
		}
		const hasCapacity = Object.values(capacityByCategory).some((v) => v > 0);
		if (!hasCapacity) {
			toast.error(
				"Please set a capacity of at least 1 for at least one service.",
			);
			return;
		}
		nextStep();
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold">Schedule & Capacity</h2>
				<p className="text-muted-foreground">
					Set your working hours and service capacity
				</p>
			</div>

			<CapacitySection
				capacityByCategory={capacityByCategory}
				bufferTime={bufferTime}
				onCapacityChange={handleCapacityChange}
				onBufferChange={setBufferTime}
			/>

			<WeeklyCalendar schedule={schedule} onDayChange={handleDayChange} />

			<div className="flex justify-between pt-4">
				<Button type="button" variant="outline" onClick={prevStep}>
					Back
				</Button>
				<Button type="button" onClick={handleNext}>
					Continue
				</Button>
			</div>
		</div>
	);
}
