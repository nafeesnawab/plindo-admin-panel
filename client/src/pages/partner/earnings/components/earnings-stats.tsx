import { ArrowUpRight, Clock, TrendingUp, Wallet } from "lucide-react";

import { Card, CardContent } from "@/ui/card";

import type { EarningsData } from "../types";

interface EarningsStatsProps {
	earnings: EarningsData;
}

export function EarningsStats({ earnings }: EarningsStatsProps) {
	return (
		<div className="grid gap-4 sm:grid-cols-3">
			<Card>
				<CardContent className="flex items-center gap-3 p-4">
					<div className="rounded-lg bg-muted p-2.5">
						<Wallet className="h-5 w-5 text-primary" />
					</div>
					<div>
						<p className="text-2xl font-bold">&euro;{earnings.total.toLocaleString()}</p>
						<p className="text-xs text-muted-foreground">Total Earnings</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="flex items-center gap-3 p-4">
					<div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2.5">
						<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div>
						<p className="text-2xl font-bold">&euro;{earnings.thisMonth.toLocaleString()}</p>
						<div className="flex items-center gap-1">
							<p className="text-xs text-muted-foreground">This Month</p>
							<span className="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400">
								<ArrowUpRight className="h-2.5 w-2.5" />
								12%
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="flex items-center gap-3 p-4">
					<div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-2.5">
						<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					</div>
					<div>
						<p className="text-2xl font-bold">&euro;{earnings.pendingPayout.toLocaleString()}</p>
						<p className="text-xs text-muted-foreground">Pending Payout</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
