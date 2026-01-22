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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
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
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-16 items-center justify-between px-4">
					<Link to="/" className="flex items-center gap-2">
						<Logo size={32} />
						<span className="text-xl font-semibold">{GLOBAL_CONFIG.appName.replace("Admin", "Partner")}</span>
					</Link>
					<div className="flex items-center gap-4">
						<Link to="/partner/register">
							<Button variant="ghost">Register as Partner</Button>
						</Link>
						<SettingButton />
					</div>
				</div>
			</header>

			<main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8 px-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Partner Login</CardTitle>
						<CardDescription>Sign in to access your partner dashboard</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

						<div className="mt-6 text-center text-sm">
							<Link to="/partner/application-status" className="text-primary hover:underline">
								Check application status
							</Link>
						</div>

						<div className="mt-4 text-center text-sm text-muted-foreground">
							Don't have an account?{" "}
							<Link to="/partner/register" className="text-primary hover:underline">
								Register now
							</Link>
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
