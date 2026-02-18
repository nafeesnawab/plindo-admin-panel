import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import partnerAuthService, { type PartnerSignInReq } from "@/api/services/partnerAuthService";
import Logo from "@/components/logo";
import { GLOBAL_CONFIG } from "@/global-config";
import SettingButton from "@/layouts/components/setting-button";
import { Button } from "@/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";

export default function PartnerLoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const form = useForm<PartnerSignInReq>({
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: PartnerSignInReq) => {
		setIsLoading(true);
		try {
			const response = await partnerAuthService.partnerSignIn(data);

			// Check if partner is approved
			if (response.partner.status !== "active") {
				toast.error("Your account is not active. Please check your application status.");
				navigate("/partner/application-status", { state: { email: data.email } });
				return;
			}

			// Store tokens (you would typically use a store here)
			localStorage.setItem(
				"partnerToken",
				JSON.stringify({
					accessToken: response.accessToken,
					refreshToken: response.refreshToken,
				}),
			);
			localStorage.setItem("partnerInfo", JSON.stringify(response.partner));

			toast.success("Login successful!");
			navigate("/partner/dashboard");
		} catch {
			toast.error("Invalid email or password. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="relative grid min-h-svh lg:grid-cols-2 bg-background">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<Link to="/" className="flex items-center gap-2 font-medium cursor-pointer">
						<Logo size={32} />
						<span className="text-xl font-semibold">{GLOBAL_CONFIG.appName.replace("Admin", "Partner")}</span>
					</Link>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<div className="flex flex-col gap-6">
							<Form {...form}>
								<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
									<div className="flex flex-col items-center gap-2 text-center">
										<h1 className="text-2xl font-bold">Partner Login</h1>
										<p className="text-balance text-sm text-muted-foreground">
											Sign in to access your partner dashboard
										</p>
									</div>

									<FormField
										control={form.control}
										name="email"
										rules={{
											required: "Email is required",
											pattern: {
												value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
												message: "Invalid email address",
											},
										}}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input type="email" placeholder="partner@example.com" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="password"
										rules={{ required: "Password is required" }}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password</FormLabel>
												<FormControl>
													<Input type="password" placeholder="••••••••" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<Button type="submit" className="w-full" disabled={isLoading}>
										{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
										Sign In
									</Button>
								</form>
							</Form>

							<div className="text-center text-sm">
								<Link
									to="/partner/application-status"
									className="text-muted-foreground hover:text-foreground hover:underline"
								>
									Check application status
								</Link>
							</div>

							<div className="text-center text-sm text-muted-foreground">
								Don't have an account?{" "}
								<Link to="/partner/register" className="text-foreground font-medium hover:underline">
									Register now
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="relative hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background lg:flex items-center justify-center">
				<div className="text-center space-y-4">
					<Logo size={120} className="mx-auto" />
					<h2 className="text-3xl font-bold text-foreground">PLINDO Partner</h2>
					<p className="text-muted-foreground max-w-sm">
						Grow your business with PLINDO. Manage bookings, services, and earnings all in one place.
					</p>
					<Link to="/partner/register">
						<Button variant="outline" className="mt-4">
							Register as Partner
						</Button>
					</Link>
				</div>
			</div>

			<div className="absolute right-2 top-2">
				<SettingButton />
			</div>
		</div>
	);
}
