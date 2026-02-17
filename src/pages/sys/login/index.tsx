import { Navigate } from "react-router";
import Logo from "@/components/logo";
import { GLOBAL_CONFIG } from "@/global-config";
import SettingButton from "@/layouts/components/setting-button";
import { useUserToken } from "@/store/userStore";
import LoginForm from "./login-form";
import { LoginProvider } from "./providers/login-provider";

function LoginPage() {
	const token = useUserToken();

	if (token.accessToken) {
		return <Navigate to={GLOBAL_CONFIG.defaultRoute} replace />;
	}

	return (
		<div className="relative grid min-h-svh lg:grid-cols-2 bg-background">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<div className="flex items-center gap-2 font-medium cursor-pointer">
						<Logo size={32} />
						<span className="text-xl font-semibold">{GLOBAL_CONFIG.appName}</span>
					</div>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<LoginProvider>
							<LoginForm />
						</LoginProvider>
					</div>
				</div>
			</div>

			<div className="relative hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background lg:flex items-center justify-center">
				<div className="text-center space-y-4">
					<Logo size={120} className="mx-auto" />
					<h2 className="text-3xl font-bold text-foreground">PLINDO Admin</h2>
					<p className="text-muted-foreground max-w-sm">
						Manage your platform, partners, and bookings all in one place.
					</p>
				</div>
			</div>

			<div className="absolute right-2 top-2">
				<SettingButton />
			</div>
		</div>
	);
}
export default LoginPage;
