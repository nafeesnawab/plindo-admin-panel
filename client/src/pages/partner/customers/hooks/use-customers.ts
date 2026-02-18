import { useQuery } from "@tanstack/react-query";

import type { Customer } from "@/api/services/customerService";
import customerService from "@/api/services/customerService";

interface UseCustomersParams {
	search: string;
	statusFilter: string;
	page: number;
	limit: number;
}

export function useCustomers({ search, statusFilter, page, limit }: UseCustomersParams) {
	const { data, isLoading } = useQuery({
		queryKey: ["partner-customers", search, statusFilter, page],
		queryFn: () =>
			customerService.getCustomers({
				search: search || undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
				page,
				limit,
			}),
	});

	const customers = data?.items ?? [];
	const totalPages = data?.totalPages ?? 1;
	const total = data?.total ?? 0;

	const withSubscriptions = customers.filter((c: Customer) => c.subscription.active).length;
	const vehicleCount = customers.reduce((sum: number, c: Customer) => sum + c.vehicles.length, 0);

	return {
		customers,
		totalPages,
		total,
		isLoading,
		withSubscriptions,
		vehicleCount,
	};
}
