import { Filter, Search, X } from "lucide-react";

import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

interface CustomersToolbarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	filterStatus: string;
	onStatusChange: (value: string) => void;
	showFilters: boolean;
	onToggleFilters: () => void;
	activeFiltersCount: number;
	onClearFilters: () => void;
}

export function CustomersToolbar({
	searchQuery,
	onSearchChange,
	filterStatus,
	onStatusChange,
	showFilters,
	onToggleFilters,
	activeFiltersCount,
	onClearFilters,
}: CustomersToolbarProps) {
	return (
		<div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
			<div className="relative flex-1 min-w-[180px]">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search customers..."
					className="pl-9 h-9"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
			</div>

			{showFilters && (
				<>
					<Select value={filterStatus} onValueChange={onStatusChange}>
						<SelectTrigger className="h-9 w-[140px] text-xs">
							<SelectValue placeholder="All Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="suspended">Suspended</SelectItem>
						</SelectContent>
					</Select>
					{activeFiltersCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClearFilters}
							className="h-9 gap-1 text-xs px-2 text-muted-foreground hover:text-foreground shrink-0"
						>
							<X className="h-3.5 w-3.5" />
							Clear
						</Button>
					)}
				</>
			)}

			<Button
				variant={showFilters ? "secondary" : "outline"}
				size="sm"
				onClick={onToggleFilters}
				className="gap-1.5 h-9 shrink-0"
			>
				<Filter className="h-3.5 w-3.5" />
				Filters
				{activeFiltersCount > 0 && (
					<Badge className="ml-0.5 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
						{activeFiltersCount}
					</Badge>
				)}
			</Button>
		</div>
	);
}
