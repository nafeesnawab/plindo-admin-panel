import { Bell, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import SettingButton from "@/layouts/components/setting-button";
import { Button } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

interface PartnerHeaderProps {
	leftSlot?: React.ReactNode;
}

export default function PartnerHeader({ leftSlot }: PartnerHeaderProps) {
	const navigate = useNavigate();

	const partnerInfo = JSON.parse(localStorage.getItem("partnerInfo") || "{}");

	const handleLogout = () => {
		localStorage.removeItem("partnerToken");
		localStorage.removeItem("partnerInfo");
		toast.success("Logged out successfully");
		navigate("/partner/login");
	};

	return (
		<header className="sticky top-0 z-header flex h-[var(--layout-header-height)] items-center justify-between border-b border-dashed bg-background px-4">
			<div className="flex items-center gap-4">{leftSlot}</div>

			<div className="flex items-center gap-2">
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5" />
					<span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
				</Button>

				<SettingButton />

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<User className="h-4 w-4" />
							</div>
							<span className="hidden md:inline-block">{partnerInfo.businessName || "Partner"}</span>
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
