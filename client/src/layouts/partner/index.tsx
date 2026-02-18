import { Icon } from "@/components/icon";
import Logo from "@/components/logo";
import { NavMini, NavVertical } from "@/components/nav";
import { GLOBAL_CONFIG } from "@/global-config";
import { down, useMediaQuery } from "@/hooks";
import { useSettingActions, useSettings } from "@/store/settingStore";
import { ThemeLayout } from "@/types/enum";
import { Button } from "@/ui/button";
import { ScrollArea } from "@/ui/scroll-area";
import { cn } from "@/utils";
import PartnerHeader from "./header";
import PartnerMain from "./main";
import { partnerNavData } from "./nav-data";
import { NavMobileLayout } from "./nav-mobile";

export default function PartnerLayout() {
	const isMobile = useMediaQuery(down("md"));

	return (
		<div data-slot="slash-layout-root" className="w-full min-h-screen bg-background">
			{isMobile ? <MobileLayout /> : <PcLayout />}
		</div>
	);
}

function MobileLayout() {
	return (
		<>
			<PartnerHeader leftSlot={<NavMobileLayout data={partnerNavData} />} />
			<PartnerMain />
		</>
	);
}

function PcLayout() {
	const { themeLayout } = useSettings();

	if (themeLayout === ThemeLayout.Horizontal) return <PcHorizontalLayout />;
	return <PcVerticalLayout />;
}

function PcHorizontalLayout() {
	return (
		<>
			<PartnerHeader leftSlot={<Logo />} />
			<PartnerMain />
		</>
	);
}

function PcVerticalLayout() {
	const settings = useSettings();
	const { themeLayout } = settings;
	const { setSettings } = useSettingActions();

	const navWidth = themeLayout === ThemeLayout.Vertical ? "var(--layout-nav-width)" : "var(--layout-nav-width-mini)";
	const mainPaddingLeft =
		themeLayout === ThemeLayout.Vertical ? "var(--layout-nav-width)" : "var(--layout-nav-width-mini)";

	const handleToggle = () => {
		setSettings({
			...settings,
			themeLayout: themeLayout === ThemeLayout.Mini ? ThemeLayout.Vertical : ThemeLayout.Mini,
		});
	};

	return (
		<>
			{/* Fixed Sidebar */}
			<nav
				data-slot="slash-layout-nav"
				className="fixed inset-y-0 left-0 flex-col h-full bg-background border-r border-dashed z-nav transition-[width] duration-300 ease-in-out"
				style={{ width: navWidth }}
			>
				<div
					className={cn("relative flex items-center py-4 px-2 h-[var(--layout-header-height)]", {
						"justify-center": themeLayout === ThemeLayout.Mini,
					})}
				>
					<div className="flex items-center justify-center">
						<Logo />
						<span
							className="text-xl font-bold transition-all duration-300 ease-in-out"
							style={{
								opacity: themeLayout === ThemeLayout.Mini ? 0 : 1,
								maxWidth: themeLayout === ThemeLayout.Mini ? 0 : "auto",
								whiteSpace: "nowrap",
								marginLeft: themeLayout === ThemeLayout.Mini ? 0 : "8px",
							}}
						>
							{GLOBAL_CONFIG.appName.replace("Admin", "Partner")}
						</span>
					</div>

					<Button
						variant="outline"
						size="icon"
						onClick={handleToggle}
						className="h-7 w-7 absolute right-0 translate-x-1/2"
					>
						{themeLayout === ThemeLayout.Mini ? (
							<Icon icon="lucide:arrow-right-to-line" size={12} />
						) : (
							<Icon icon="lucide:arrow-left-to-line" size={12} />
						)}
					</Button>
				</div>

				<ScrollArea className={cn("h-[calc(100vh-var(--layout-header-height))] px-2 bg-background")}>
					{themeLayout === ThemeLayout.Mini ? <NavMini data={partnerNavData} /> : <NavVertical data={partnerNavData} />}
				</ScrollArea>
			</nav>

			<div
				className="relative w-full min-h-screen transition-[padding] duration-300 ease-in-out"
				style={{ paddingLeft: mainPaddingLeft }}
			>
				<PartnerHeader />
				<PartnerMain />
			</div>
		</>
	);
}
