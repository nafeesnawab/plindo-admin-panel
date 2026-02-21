import { Eye, EyeOff, Loader2, Store, UserCog } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { UnifiedSignInReq } from "@/api/services/authService";
import { useUnifiedSignIn } from "@/store/authStore";
import { Button } from "@/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/ui/form";
import { Input } from "@/ui/input";
import { cn } from "@/utils";

const DEMO_CREDENTIALS = {
	admin: {
		email: "admin@plindo.com",
		password: "admin123",
		label: "Admin Account",
		icon: UserCog,
	},
	partner: {
		email: "partner@plindo.com",
		password: "partner123",
		label: "Partner Account",
		icon: Store,
	},
};

export function UnifiedLoginForm({
	className,
	...props
}: React.ComponentPropsWithoutRef<"form">) {
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();
	const signIn = useUnifiedSignIn();

	const form = useForm<UnifiedSignInReq>({
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const fillCredentials = (type: "admin" | "partner") => {
		const creds = DEMO_CREDENTIALS[type];
		form.setValue("email", creds.email);
		form.setValue("password", creds.password);
		toast.success(`${creds.label} credentials filled`);
	};

	const handleFinish = async (values: UnifiedSignInReq) => {
		setLoading(true);
		try {
			const result = await signIn(values);

			if (result.inactive) {
				navigate(result.redirectTo, { state: { email: values.email } });
				return;
			}

			navigate(result.redirectTo, { replace: true });
			toast.success("Login successful!", {
				closeButton: true,
			});
		} catch {
			// Error already handled in signIn
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={cn("flex flex-col gap-6", className)}>
			<Form {...form} {...props}>
				<form onSubmit={form.handleSubmit(handleFinish)} className="space-y-4">
					<div className="flex flex-col items-center gap-2 text-center">
						<h1 className="text-2xl font-bold">Sign In</h1>
						<p className="text-balance text-sm text-muted-foreground">
							Enter your credentials to access your account
						</p>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => fillCredentials("admin")}
							className="gap-2 text-xs"
						>
							<UserCog className="h-3.5 w-3.5" />
							Admin Demo
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => fillCredentials("partner")}
							className="gap-2 text-xs"
						>
							<Store className="h-3.5 w-3.5" />
							Partner Demo
						</Button>
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
									<Input type="email" placeholder="your@email.com" {...field} />
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
									<div className="relative">
										<Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pr-10" {...field} />
										<button
											type="button"
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
											onClick={() => setShowPassword(!showPassword)}
										>
											{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading && <Loader2 className="animate-spin mr-2" />}
						Sign In
					</Button>
				</form>
			</Form>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t border-border" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-background px-2 text-muted-foreground">
						Partner Portal
					</span>
				</div>
			</div>

			<div className="text-center text-sm text-muted-foreground space-y-2">
				<div>
					Don't have a partner account?{" "}
					<a
						href="/partner/register"
						className="text-foreground font-medium hover:underline"
					>
						Register now
					</a>
				</div>
				<div>
					<a
						href="/partner/application-status"
						className="text-muted-foreground hover:text-foreground hover:underline"
					>
						Check application status
					</a>
				</div>
			</div>
		</div>
	);
}

export default UnifiedLoginForm;
