import { ArrowDownToLine } from "lucide-react";

import { Button } from "@/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { cn } from "@/utils";

import type { Payout } from "../types";
import { PAYOUT_STATUS_CONFIG } from "../types";

interface PayoutsTableProps {
	payouts: Payout[];
	onDownloadStatement: (payoutId: string) => void;
}

export function PayoutsTable({ payouts, onDownloadStatement }: PayoutsTableProps) {
	return (
		<div className="overflow-auto rounded-xl border border-border">
			<Table>
				<TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
					<TableRow className="hover:bg-transparent border-b border-border">
						<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-4">Period</TableHead>
						<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Bookings</TableHead>
						<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Net Amount</TableHead>
						<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
						<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[60px] text-right pr-4">Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{payouts.map((payout) => {
						const statusConfig = PAYOUT_STATUS_CONFIG[payout.status];
						return (
							<TableRow key={payout.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
								<TableCell className="py-3 pl-4 text-sm">{payout.period}</TableCell>
								<TableCell className="py-3 text-right text-sm tabular-nums">{payout.totalBookings}</TableCell>
								<TableCell className="py-3 text-right text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">&euro;{payout.netAmount.toFixed(2)}</TableCell>
								<TableCell className="py-3">
									<span
										className={cn(
											"inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
											statusConfig.color,
											statusConfig.darkColor,
										)}
									>
										<span
											className={cn(
												"h-1.5 w-1.5 rounded-full",
												payout.status === "completed" ? "bg-emerald-500 dark:bg-emerald-400" :
												payout.status === "pending" ? "bg-yellow-500 dark:bg-yellow-400" :
												"bg-blue-500 dark:bg-blue-400",
											)}
										/>
										{statusConfig.label}
									</span>
								</TableCell>
								<TableCell className="py-3 text-right pr-4">
									<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDownloadStatement(payout.id)}>
										<ArrowDownToLine className="h-4 w-4" />
									</Button>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
