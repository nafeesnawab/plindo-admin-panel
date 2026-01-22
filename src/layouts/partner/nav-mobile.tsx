import { useState } from "react";
import { Icon } from "@/components/icon";
import Logo from "@/components/logo";
import { NavVertical } from "@/components/nav";
import type { NavProps } from "@/components/nav/types";
import { GLOBAL_CONFIG } from "@/global-config";
import { Button } from "@/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";

type Props = {
	data: NavProps["data"];
};

export function NavMobileLayout({ data }: Props) {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="ghost" size="icon" className="md:hidden">
					<Icon icon="lucide:menu" size={20} />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-72 p-0">
				<div className="flex items-center gap-2 border-b p-4">
					<Logo />
					<span className="text-lg font-bold">{GLOBAL_CONFIG.appName.replace("Admin", "Partner")}</span>
				</div>
				<div className="p-2">
					<NavVertical data={data} />
				</div>
			</SheetContent>
		</Sheet>
	);
}
