import { CheckCircle2, Shield, TrendingUp, Users, Zap } from "lucide-react";
import { Navigate } from "react-router";
import { UserRole } from "@/api/services/authService";
import Logo from "@/components/logo";
import { GLOBAL_CONFIG } from "@/global-config";
import SettingButton from "@/layouts/components/setting-button";
import { useCurrentRole, usePartnerToken, useUserToken } from "@/store/authStore";
import UnifiedLoginForm from "./unified-login-form";

function UnifiedLoginPage() {
	const userToken = useUserToken();
	const partnerToken = usePartnerToken();
	const currentRole = useCurrentRole();

	if (currentRole === UserRole.ADMIN && userToken.accessToken) {
		return <Navigate to={GLOBAL_CONFIG.defaultRoute} replace />;
	}

	if (currentRole === UserRole.PARTNER && partnerToken.accessToken) {
		return <Navigate to="/partner/dashboard" replace />;
	}

	const features = [
		{
			icon: Shield,
			title: "Secure & Reliable",
			description: "Enterprise-grade security for your data",
		},
		{
			icon: Users,
			title: "Multi-Role Access",
			description: "Admin and partner portals in one place",
		},
		{
			icon: TrendingUp,
			title: "Real-time Analytics",
			description: "Track performance and growth metrics",
		},
		{
			icon: Zap,
			title: "Fast & Efficient",
			description: "Optimized for speed and productivity",
		},
	];

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
						<UnifiedLoginForm />
					</div>
				</div>
			</div>

			<div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background">
				<div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />

				<div className="relative z-10 max-w-lg px-8 space-y-8">
					<div className="text-center space-y-4">
						<div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 backdrop-blur-sm border border-primary/20 mb-4">
							<Logo size={48} />
						</div>
						<h2 className="text-4xl font-bold text-foreground tracking-tight">Welcome to PLINDO</h2>
						<p className="text-lg text-muted-foreground">
							Unified platform for administrators and partners to manage bookings, services, and growth.
						</p>
					</div>

					<div className="grid gap-4">
						{features.map((feature, index) => (
							<div
								key={index}
								className="flex items-start gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors"
							>
								<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
									<feature.icon className="w-5 h-5" />
								</div>
								<div className="space-y-1">
									<h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
									<p className="text-xs text-muted-foreground">{feature.description}</p>
								</div>
								<CheckCircle2 className="w-4 h-4 text-primary/60 ml-auto flex-shrink-0 mt-2" />
							</div>
						))}
					</div>

					<div className="pt-4 border-t border-border/50">
						<p className="text-xs text-center text-muted-foreground">
							Trusted by businesses to streamline operations and drive growth
						</p>
					</div>
				</div>
			</div>

			<div className="absolute right-2 top-2 z-50">
				<SettingButton />
			</div>
		</div>
	);
}

export default UnifiedLoginPage;
