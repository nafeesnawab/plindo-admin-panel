import { useRouter } from "@/routes/hooks";
import { useAuthActions, useUserInfo } from "@/store/authStore";
import { Button } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

/**
 * Account Dropdown
 */
export default function AccountDropdown() {
	const { replace } = useRouter();
	const { username, email, avatar } = useUserInfo();
	const { clearAuth } = useAuthActions();
	const logout = () => {
		clearAuth();
		replace("/auth/login");
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="rounded-full">
					<img className="h-6 w-6 rounded-full" src={avatar} alt="" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<div className="flex items-center gap-2 p-2">
					<img className="h-10 w-10 rounded-full" src={avatar} alt="" />
					<div className="flex flex-col items-start">
						<div className="text-text-primary text-sm font-medium">{username}</div>
						<div className="text-text-secondary text-xs">{email}</div>
					</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => replace("/settings")}>
					Settings
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="font-bold text-warning" onClick={logout}>
					Logout
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
