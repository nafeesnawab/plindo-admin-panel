import apiClient from "../apiClient";

export interface PartnerInvoice {
	month: string;
	totalBookings: number;
	grossRevenue: number;
	commissionPaid: number;
	netAmount: number;
}

const partnerInvoicesService = {
	getInvoices: () => apiClient.get<PartnerInvoice[]>({ url: "/partner/invoices" }),

	downloadPdf: (month: string) => {
		window.location.href = `${import.meta.env.VITE_API_BASE_URL || "/api"}/partner/invoices/${month}/download`;
	},
};

export default partnerInvoicesService;
