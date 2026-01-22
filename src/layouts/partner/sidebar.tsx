import { Calendar, Car, ClipboardList, CreditCard, LayoutDashboard, Settings, Star, Users } from "lucide-react";
import { Link, useLocation } from "react-router";
import Logo from "@/components/logo";
import { GLOBAL_CONFIG } from "@/global-config";
import { cn } from "@/utils";

const navigation = [
	{ name: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
	{ name: "Bookings", href: "/partner/bookings", icon: ClipboardList },
	{ name: "Schedule", href: "/partner/schedule", icon: Calendar },
	{ name: "Services", href: "/partner/services", icon: Car },
	{ name: "Customers", href: "/partner/customers", icon: Users },
	{ name: "Reviews", href: "/partner/reviews", icon: Star },
	{ name: "Earnings", href: "/partner/earnings", icon: CreditCard },
	{ name: "Settings", href: "/partner/settings", icon: Settings },
];

export default function PartnerSidebar() {
	const location = useLocation();

	return (
		<aside className="hidden w-64 flex-shrink-0 border-r bg-card lg:block">
			<div className="flex h-full flex-col">
				{/* Logo */}
				<div className="flex h-16 items-center gap-2 border-b px-6">
					<Logo size={32} />
					<span className="text-lg font-semibold">{GLOBAL_CONFIG.appName.replace("Admin", "Partner")}</span>
				</div>

				{/* Navigation */}
				<nav className="flex-1 space-y-1 p-4">
					{navigation.map((item) => {
						const isActive = location.pathname === item.href;
						return (
							<Link
								key={item.name}
								to={item.href}
								className={cn(
									"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<item.icon className="h-5 w-5" />
								{item.name}
							</Link>
						);
					})}
				</nav>
			</div>
		</aside>
	);
}
