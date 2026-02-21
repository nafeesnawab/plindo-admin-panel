import { useState } from "react";

import type { Customer } from "@/api/services/customerService";

import { CustomerDetailsDialog } from "./components/customer-details-dialog";
import { CustomerStats } from "./components/customer-stats";
import { CustomersTable } from "./components/customers-table";
import { CustomersToolbar } from "./components/customers-toolbar";
import { useCustomers } from "./hooks/use-customers";
import { getStatCards } from "./types";

export default function PartnerCustomersPage() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [showFilters, setShowFilters] = useState(false);
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);

	const { customers, total, isLoading, withSubscriptions, vehicleCount } = useCustomers({
		search,
		statusFilter,
		page: 1,
		limit: 100,
	});

	const activeFiltersCount = [statusFilter !== "all"].filter(Boolean).length;

	const handleViewCustomer = (customer: Customer) => {
		setSelectedCustomer(customer);
		setDetailsOpen(true);
	};

	const clearFilters = () => {
		setStatusFilter("all");
		setSearch("");
	};

	const stats = getStatCards(total, withSubscriptions, vehicleCount);

	return (
		<div className="flex flex-col gap-4 h-full">
			<CustomerStats stats={stats} />

			<div className="flex items-center gap-2 flex-wrap">
				<CustomersToolbar
					searchQuery={search}
					onSearchChange={setSearch}
					filterStatus={statusFilter}
					onStatusChange={setStatusFilter}
					showFilters={showFilters}
					onToggleFilters={() => setShowFilters(!showFilters)}
					activeFiltersCount={activeFiltersCount}
					onClearFilters={clearFilters}
				/>
			</div>

			<CustomersTable
				customers={customers}
				totalCount={total}
				loading={isLoading}
				onViewCustomer={handleViewCustomer}
			/>

			<CustomerDetailsDialog
				open={detailsOpen}
				onOpenChange={setDetailsOpen}
				customer={selectedCustomer}
			/>
		</div>
	);
}
