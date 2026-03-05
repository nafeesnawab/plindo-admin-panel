import apiClient from "../apiClient";

const reportsService = {
	downloadBookings: (from?: string, to?: string) => {
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		window.location.href = `${import.meta.env.VITE_API_BASE_URL || "/api"}/admin/reports/bookings?${params}`;
	},
	downloadFinance: (from?: string, to?: string) => {
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		window.location.href = `${import.meta.env.VITE_API_BASE_URL || "/api"}/admin/reports/finance?${params}`;
	},
	downloadPartners: (from?: string, to?: string) => {
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		window.location.href = `${import.meta.env.VITE_API_BASE_URL || "/api"}/admin/reports/partners?${params}`;
	},
	downloadCustomers: (from?: string, to?: string) => {
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		window.location.href = `${import.meta.env.VITE_API_BASE_URL || "/api"}/admin/reports/customers?${params}`;
	},
};

export default reportsService;
