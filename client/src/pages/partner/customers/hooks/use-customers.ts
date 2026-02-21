import { useQuery } from "@tanstack/react-query";

import apiClient from "@/api/apiClient";
import type { Customer } from "@/api/services/customerService";

interface UseCustomersParams {
	search: string;
	statusFilter: string;
	page: number;
	limit: number;
}

interface PartnerCustomersResponse {
	customers: Customer[];
	total: number;
}

export function useCustomers({ search, statusFilter }: UseCustomersParams) {
	const { data, isLoading } = useQuery({
		queryKey: ["partner-customers", search, statusFilter],
		queryFn: () =>
			apiClient.get<PartnerCustomersResponse>({
				url: "/partner/customers",
				params: {
					search: search || undefined,
					status: statusFilter !== "all" ? statusFilter : undefined,
				},
			}),
	});

	const customers = data?.customers ?? [];
	const total = data?.total ?? 0;
	const totalPages = 1;

	const withSubscriptions = customers.filter(
		(c: Customer) => c.subscription?.active,
	).length;
	const vehicleCount = customers.reduce(
		(sum: number, c: Customer) => sum + (c.vehicles?.length ?? 0),
		0,
	);

	return {
		customers,
		totalPages,
		total,
		isLoading,
		withSubscriptions,
		vehicleCount,
	};
}
