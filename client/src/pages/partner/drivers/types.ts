export interface Driver {
	id: string;
	fullName: string;
	phone: string;
	email: string;
	licenseNumber: string;
	licenseUrl?: string;
	licenseExpiry: string;
	insuranceUrl?: string;
	insuranceExpiry: string;
	photoUrl?: string;
	status: "active" | "inactive";
	createdAt: string;
}

export type DriverFormData = Omit<Driver, "id" | "createdAt">;

export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50] as const;

export const STATUS_CONFIG: Record<Driver["status"], { label: string; color: string; darkColor: string }> = {
	active: {
		label: "Active",
		color: "bg-emerald-50 text-emerald-700 border-emerald-200",
		darkColor: "dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
	},
	inactive: {
		label: "Inactive",
		color: "bg-gray-50 text-gray-600 border-gray-200",
		darkColor: "dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700",
	},
};

export const EMPTY_FORM: DriverFormData = {
	fullName: "",
	phone: "",
	email: "",
	licenseNumber: "",
	licenseExpiry: "",
	insuranceExpiry: "",
	status: "active",
};

export const formatDate = (dateStr: string): string => {
	return new Date(dateStr).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

export const MOCK_DRIVERS: Driver[] = [
	{
		id: "d1",
		fullName: "James Wilson",
		phone: "+1 (555) 123-4567",
		email: "james.wilson@email.com",
		licenseNumber: "DL-123456789",
		licenseUrl: "/uploads/license-james.pdf",
		licenseExpiry: "2025-03-15",
		insuranceUrl: "/uploads/insurance-james.pdf",
		insuranceExpiry: "2025-06-20",
		photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
		status: "active",
		createdAt: "2024-01-15",
	},
	{
		id: "d2",
		fullName: "Michael Chen",
		phone: "+1 (555) 234-5678",
		email: "michael.chen@email.com",
		licenseNumber: "DL-987654321",
		licenseUrl: "/uploads/license-michael.pdf",
		licenseExpiry: "2026-01-10",
		insuranceUrl: "/uploads/insurance-michael.pdf",
		insuranceExpiry: "2025-01-25",
		photoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
		status: "active",
		createdAt: "2024-02-20",
	},
	{
		id: "d3",
		fullName: "David Rodriguez",
		phone: "+1 (555) 345-6789",
		email: "david.r@email.com",
		licenseNumber: "DL-456789123",
		licenseExpiry: "2024-12-01",
		insuranceExpiry: "2024-11-15",
		status: "inactive",
		createdAt: "2024-03-10",
	},
	{
		id: "d4",
		fullName: "Robert Taylor",
		phone: "+1 (555) 456-7890",
		email: "robert.taylor@email.com",
		licenseNumber: "DL-789123456",
		licenseUrl: "/uploads/license-robert.pdf",
		licenseExpiry: "2025-08-30",
		insuranceUrl: "/uploads/insurance-robert.pdf",
		insuranceExpiry: "2025-09-15",
		photoUrl: "https://randomuser.me/api/portraits/men/67.jpg",
		status: "active",
		createdAt: "2024-04-05",
	},
];
