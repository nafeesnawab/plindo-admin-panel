import { Car, Minus, Plus, Sparkles, Timer } from "lucide-react";

import type { ServiceCategory } from "@/types/booking";
import { SERVICE_CATEGORY_LABELS } from "@/types/booking";
import { Button } from "@/ui/button";

interface CapacitySectionProps {
	capacityByCategory: Record<ServiceCategory, number>;
	bufferTime: number;
	onCapacityChange: (category: ServiceCategory, value: number) => void;
	onBufferChange: (value: number) => void;
}

function Stepper({
	value,
	min,
	max,
	onChange,
	suffix,
}: { value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string }) {
	return (
		<div className="flex items-center gap-1">
			<Button
				variant="outline"
				size="icon"
				className="h-6 w-6"
				onClick={() => onChange(Math.max(min, value - (suffix ? 5 : 1)))}
				disabled={value <= min}
			>
				<Minus className="h-3 w-3" />
			</Button>
			<span className="w-8 text-center text-xs font-semibold tabular-nums">
				{value}
				{suffix}
			</span>
			<Button
				variant="outline"
				size="icon"
				className="h-6 w-6"
				onClick={() => onChange(Math.min(max, value + (suffix ? 5 : 1)))}
				disabled={value >= max}
			>
				<Plus className="h-3 w-3" />
			</Button>
		</div>
	);
}

const CATEGORIES: { key: ServiceCategory; icon: React.ReactNode; color: string }[] = [
	{
		key: "wash",
		icon: <Car className="h-3.5 w-3.5" />,
		color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
	},
	{
		key: "detailing",
		icon: <Sparkles className="h-3.5 w-3.5" />,
		color: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
	},
];

export function CapacitySection({ capacityByCategory, bufferTime, onCapacityChange, onBufferChange }: CapacitySectionProps) {
	return (
		<div className="flex flex-wrap items-center gap-5 px-4 py-3 rounded-xl border border-border bg-card shadow-sm">
			{CATEGORIES.map(({ key, icon, color }) => (
				<div key={key} className="flex items-center gap-2.5">
					<div className={`p-1.5 rounded-md ${color}`}>{icon}</div>
					<div className="mr-1">
						<p className="text-[11px] text-muted-foreground leading-none">{SERVICE_CATEGORY_LABELS[key]}</p>
						<p className="text-xs font-semibold mt-0.5">
							{capacityByCategory[key]} {capacityByCategory[key] === 1 ? "bay" : "bays"}
						</p>
					</div>
					<Stepper value={capacityByCategory[key]} min={0} max={20} onChange={(v) => onCapacityChange(key, v)} />
				</div>
			))}

			<div className="h-8 w-px bg-border" />

			<div className="flex items-center gap-2.5">
				<div className="p-1.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
					<Timer className="h-3.5 w-3.5" />
				</div>
				<div className="mr-1">
					<p className="text-[11px] text-muted-foreground leading-none">Buffer Time</p>
					<p className="text-xs font-semibold mt-0.5">{bufferTime}m between jobs</p>
				</div>
				<Stepper value={bufferTime} min={0} max={60} onChange={onBufferChange} suffix="m" />
			</div>
		</div>
	);
}
