import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { SignInReq } from "@/api/services/userService";
import { GLOBAL_CONFIG } from "@/global-config";
import { useSignIn } from "@/store/userStore";
import { Button } from "@/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { cn } from "@/utils";
import { LoginStateEnum, useLoginStateContext } from "./providers/login-provider";

const ADMIN_CREDENTIALS = {
	email: "admin@plindo.com",
	password: "admin123",
};

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"form">) {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const { loginState } = useLoginStateContext();
	const signIn = useSignIn();

	const form = useForm<SignInReq>({
		defaultValues: {
			username: ADMIN_CREDENTIALS.email,
			password: ADMIN_CREDENTIALS.password,
		},
	});

	if (loginState !== LoginStateEnum.LOGIN) return null;

	const handleFinish = async (values: SignInReq) => {
		setLoading(true);
		try {
			await signIn(values);
			navigate(GLOBAL_CONFIG.defaultRoute, { replace: true });
			toast.success("Login successful!", {
				closeButton: true,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={cn("flex flex-col gap-6", className)}>
			<Form {...form} {...props}>
				<form onSubmit={form.handleSubmit(handleFinish)} className="space-y-4">
					<div className="flex flex-col items-center gap-2 text-center">
						<h1 className="text-2xl font-bold">Admin Login</h1>
						<p className="text-balance text-sm text-muted-foreground">
							Enter your credentials to access the admin panel
						</p>
					</div>

					<FormField
						control={form.control}
						name="username"
						rules={{ required: "Email is required" }}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input type="email" placeholder="admin@plindo.com" {...field} />
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

					<Button type="submit" className="w-full">
						{loading && <Loader2 className="animate-spin mr-2" />}
						Sign In
					</Button>
				</form>
			</Form>
		</div>
	);
}

export default LoginForm;
