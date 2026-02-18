import { Bell, LogOut, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import SettingButton from "@/layouts/components/setting-button";
import { useAuthActions } from "@/store/authStore";
import { Button } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
	"/partner/dashboard": { title: "Dashboard", subtitle: "Welcome back! Here's your business overview." },
	"/partner/bookings": { title: "Bookings", subtitle: "Manage your scheduled appointments" },
	"/partner/schedule": { title: "Schedule & Capacity", subtitle: "Set your working hours and service capacity" },
	"/partner/messages": { title: "Messages", subtitle: "Conversations with your customers" },
	"/partner/services": { title: "Services", subtitle: "Manage your car wash and detailing services" },
	"/partner/products": { title: "Products for Sale", subtitle: "Manage your shop products and orders" },
	"/partner/drivers": { title: "Drivers Management", subtitle: "Manage your team of drivers" },
	"/partner/customers": { title: "Customers", subtitle: "View customers who have booked with your business" },
	"/partner/reviews": { title: "Reviews & Ratings", subtitle: "Manage customer feedback and respond to reviews" },
	"/partner/earnings": { title: "Earnings & Payments", subtitle: "Track your earnings and manage payouts" },
	"/partner/settings": { title: "Settings", subtitle: "Manage your account and preferences" },
};

function getPageMeta(pathname: string) {
	if (PAGE_META[pathname]) return PAGE_META[pathname];
	// Handle dynamic routes like /partner/bookings/123
	const segments = pathname.split("/").filter(Boolean);
	if (segments.length >= 2) {
		const base = `/${segments[0]}/${segments[1]}`;
		if (PAGE_META[base]) return PAGE_META[base];
	}
	return null;
}

interface PartnerHeaderProps {
	leftSlot?: React.ReactNode;
}

export default function PartnerHeader({ leftSlot }: PartnerHeaderProps) {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { clearAuth } = useAuthActions();

	const partnerInfo = JSON.parse(localStorage.getItem("partnerInfo") || "{}");
	const pageMeta = getPageMeta(pathname);

	const handleLogout = () => {
		clearAuth();
		toast.success("Logged out successfully");
		navigate("/auth/login", { replace: true });
	};

	return (
		<header className="sticky top-0 z-header flex h-[var(--layout-header-height)] items-center justify-between border-b border-dashed bg-background px-6">
			<div className="flex items-center gap-4">
				{leftSlot}
				{pageMeta && (
					<div className="hidden md:block">
						<h1 className="text-base font-semibold leading-tight">{pageMeta.title}</h1>
						<p className="text-xs text-muted-foreground">{pageMeta.subtitle}</p>
					</div>
				)}
			</div>

			<div className="flex items-center gap-1">
				<Button variant="ghost" size="icon" className="relative h-9 w-9">
					<Bell className="h-4 w-4" />
					<span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
				</Button>

				<SettingButton />

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="flex items-center gap-2 ml-1">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<User className="h-4 w-4" />
							</div>
							<span className="hidden md:inline-block text-sm">{partnerInfo.businessName || "Partner"}</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>My Account</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => navigate("/partner/settings")}>
							<User className="mr-2 h-4 w-4" />
							Profile Settings
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout} className="text-destructive">
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
