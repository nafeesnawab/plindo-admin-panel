import { Filter, Search, X } from "lucide-react";

import type { ProductCategory } from "@/types/product";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

import { CATEGORY_LABELS } from "../types";

interface ProductsToolbarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	filterStatus: string;
	onStatusChange: (value: string) => void;
	filterCategory: string;
	onCategoryChange: (value: string) => void;
	showFilters: boolean;
	onToggleFilters: () => void;
	activeFiltersCount: number;
	onClearFilters: () => void;
}

export function ProductsToolbar({
	searchQuery,
	onSearchChange,
	filterStatus,
	onStatusChange,
	filterCategory,
	onCategoryChange,
	showFilters,
	onToggleFilters,
	activeFiltersCount,
	onClearFilters,
}: ProductsToolbarProps) {
	return (
		<div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
			<div className="relative flex-1 min-w-[180px]">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search products..."
					className="pl-9 pr-9 h-9"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
				{searchQuery && (
					<button
						type="button"
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						onClick={() => onSearchChange("")}
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			{showFilters && (
				<>
					<Select value={filterStatus} onValueChange={onStatusChange}>
						<SelectTrigger className="h-9 w-[140px] text-xs">
							<SelectValue placeholder="All Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="available">Available</SelectItem>
							<SelectItem value="unavailable">Unavailable</SelectItem>
							<SelectItem value="out_of_stock">Out of Stock</SelectItem>
						</SelectContent>
					</Select>
					<Select value={filterCategory} onValueChange={onCategoryChange}>
						<SelectTrigger className="h-9 w-[150px] text-xs">
							<SelectValue placeholder="All Categories" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							{(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
								<SelectItem key={cat} value={cat}>
									{CATEGORY_LABELS[cat]}
								</SelectItem>
							))}
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
