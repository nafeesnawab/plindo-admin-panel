import { useMutation, useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import slotBookingService from "@/api/services/slotBookingService";
import { useUserInfo } from "@/store/userStore";
import type { DayAvailability, PartnerCapacity, ServiceCategory, WeeklyAvailability } from "@/types/booking";
import type { DayAvailabilityExtended } from "../types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function makeDefaultSchedule(): DayAvailabilityExtended[] {
	return DAY_NAMES.map((name, index) => ({
		dayOfWeek: index,
		dayName: name,
		isEnabled: index !== 0,
		timeBlocks: [
			{
				id: nanoid(8),
				start: index === 6 ? "09:00" : "08:00",
				end: index === 6 ? "14:00" : "18:00",
			},
		],
	}));
}

function convertToExtended(schedule: DayAvailability[]): DayAvailabilityExtended[] {
	return schedule.map((day) => ({
		...day,
		timeBlocks: day.timeBlocks.map((block) => ({
			...block,
			id: nanoid(8),
		})),
	}));
}

function convertToStandard(schedule: DayAvailabilityExtended[]): DayAvailability[] {
	return schedule.map((day) => ({
		...day,
		timeBlocks: day.timeBlocks.map(({ id, ...block }) => block),
	}));
}

export function useSchedule() {
	const userInfo = useUserInfo();
	const partnerId = (userInfo as any)?.partnerId || userInfo?.id || "demo-partner-1";

	const [hasChanges, setHasChanges] = useState(false);
	const hydrated = useRef(false);

	const [schedule, setSchedule] = useState<DayAvailabilityExtended[]>(makeDefaultSchedule);

	const [capacityByCategory, setCapacityByCategory] = useState<Record<ServiceCategory, number>>({
		wash: 5,
		detailing: 2,
		other: 0,
	});
	const [bufferTime, setBufferTime] = useState(15);

	// Fetch
	const { data: existingAvailability, isLoading: loadingAvailability } = useQuery({
		queryKey: ["partner-availability", partnerId],
		queryFn: () => slotBookingService.getWeeklyAvailability(partnerId),
		refetchOnWindowFocus: false,
		enabled: !!partnerId,
	});

	const { data: existingCapacity, isLoading: loadingCapacity } = useQuery({
		queryKey: ["partner-capacity", partnerId],
		queryFn: () => slotBookingService.getPartnerCapacity(partnerId),
		refetchOnWindowFocus: false,
		enabled: !!partnerId,
	});

	// Hydrate only on initial load
	useEffect(() => {
		if (existingAvailability?.schedule && !hydrated.current) {
			setSchedule(convertToExtended(existingAvailability.schedule));
			setBufferTime(existingAvailability.bufferTimeMinutes || 15);
			hydrated.current = true;
		}
	}, [existingAvailability]);

	useEffect(() => {
		if (existingCapacity?.capacityByCategory && !hydrated.current) {
			setCapacityByCategory(existingCapacity.capacityByCategory);
		}
		if (existingCapacity?.bufferTimeMinutes && !hydrated.current) {
			setBufferTime(existingCapacity.bufferTimeMinutes);
		}
	}, [existingCapacity]);

	// Mutations
	const saveAvailabilityMutation = useMutation({
		mutationFn: (data: Partial<WeeklyAvailability>) => slotBookingService.updateWeeklyAvailability(data, partnerId),
	});

	const saveCapacityMutation = useMutation({
		mutationFn: (data: Partial<PartnerCapacity>) => slotBookingService.updatePartnerCapacity(data, partnerId),
	});

	const isSaving = saveAvailabilityMutation.isPending || saveCapacityMutation.isPending;

	// Handlers
	const handleDayChange = useCallback((updated: DayAvailabilityExtended) => {
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
			const standardSchedule = convertToStandard(schedule);
			await Promise.all([
				saveAvailabilityMutation.mutateAsync({
					partnerId,
					schedule: standardSchedule,
					bufferTimeMinutes: bufferTime,
					maxAdvanceBookingDays: 14,
				}),
				saveCapacityMutation.mutateAsync({
					partnerId,
					capacityByCategory,
					bufferTimeMinutes: bufferTime,
				}),
			]);
			toast.success("Settings saved successfully");
			setHasChanges(false);
		} catch {
			toast.error("Failed to save settings");
		}
	}, [partnerId, schedule, capacityByCategory, bufferTime, saveAvailabilityMutation, saveCapacityMutation]);

	const isLoading = loadingAvailability || loadingCapacity;
	const totalBays = capacityByCategory.wash + capacityByCategory.detailing + capacityByCategory.other;
	const activeDays = schedule.filter((d) => d.isEnabled).length;

	return {
		schedule,
		capacityByCategory,
		bufferTime,
		hasChanges,
		isSaving,
		isLoading,
		totalBays,
		activeDays,
		handleDayChange,
		handleCapacityChange,
		handleBufferChange,
		handleSave,
	};
}
