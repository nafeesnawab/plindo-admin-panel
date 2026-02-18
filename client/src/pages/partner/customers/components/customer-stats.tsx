import { Car, Star, User } from "lucide-react";

import { Card, CardContent } from "@/ui/card";
import { cn } from "@/utils";

import type { StatCard } from "../types";

const ICON_MAP = {
	users: User,
	star: Star,
	car: Car,
} as const;

interface CustomerStatsProps {
	stats: StatCard[];
}

export function CustomerStats({ stats }: CustomerStatsProps) {
	return (
		<div className="grid gap-4 sm:grid-cols-3">
			{stats.map((stat) => {
				const IconComponent = ICON_MAP[stat.icon];
				return (
					<Card key={stat.label}>
						<CardContent className="flex items-center gap-4 pt-6">
							<div
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-lg",
									stat.color,
									stat.darkColor,
								)}
							>
								<IconComponent className={cn("h-5 w-5", stat.iconColor, stat.darkIconColor)} />
							</div>
							<div>
								<p className="text-2xl font-bold">{stat.value}</p>
								<p className="text-sm text-muted-foreground">{stat.label}</p>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
