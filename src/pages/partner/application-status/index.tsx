import { AlertCircle, CheckCircle2, Clock, Loader2, Mail, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import partnerAuthService from "@/api/services/partnerAuthService";
import Logo from "@/components/logo";
import { GLOBAL_CONFIG } from "@/global-config";
import SettingButton from "@/layouts/components/setting-button";
import type { PartnerApplication } from "@/types/partner";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

type StatusType = "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<
	StatusType,
	{ icon: React.ReactNode; color: string; bgColor: string; title: string; description: string }
> = {
	pending: {
		icon: <Clock className="h-12 w-12" />,
		color: "text-amber-500",
		bgColor: "bg-amber-50 dark:bg-amber-950/20",
		title: "Application Under Review",
		description: "Our team is reviewing your application. This usually takes 1-3 business days.",
	},
	approved: {
		icon: <CheckCircle2 className="h-12 w-12" />,
		color: "text-green-500",
		bgColor: "bg-green-50 dark:bg-green-950/20",
		title: "Application Approved!",
		description: "Congratulations! Your application has been approved. You can now login to your partner dashboard.",
	},
	rejected: {
		icon: <XCircle className="h-12 w-12" />,
		color: "text-red-500",
		bgColor: "bg-red-50 dark:bg-red-950/20",
		title: "Application Not Approved",
		description: "Unfortunately, your application was not approved at this time.",
	},
};

export default function PartnerApplicationStatusPage() {
	const location = useLocation();
	const [email, setEmail] = useState((location.state as { email?: string })?.email || "");
	const [application, setApplication] = useState<PartnerApplication | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasChecked, setHasChecked] = useState(false);

	const checkStatus = async () => {
		if (!email.trim()) {
			setError("Please enter your email address");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const result = await partnerAuthService.getApplicationStatus(email);
			setApplication(result);
			setHasChecked(true);
		} catch {
			setError("No application found with this email address. Please check and try again.");
			setApplication(null);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (email && !hasChecked) {
			checkStatus();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const statusConfig = application ? STATUS_CONFIG[application.status] : null;

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
							<Button variant="ghost">New Registration</Button>
						</Link>
						<Link to="/partner/login">
							<Button variant="ghost">Login</Button>
						</Link>
						<SettingButton />
					</div>
				</div>
			</header>

			<main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8 px-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Application Status</CardTitle>
						<CardDescription>Check the status of your partner application</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{!hasChecked || !application ? (
							<>
								<div className="space-y-2">
									<Label htmlFor="email">Email Address</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="email"
											type="email"
											placeholder="Enter your registered email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="pl-10"
											onKeyDown={(e) => e.key === "Enter" && checkStatus()}
										/>
									</div>
								</div>

								{error && (
									<div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
										<AlertCircle className="h-4 w-4" />
										{error}
									</div>
								)}

								<Button className="w-full" onClick={checkStatus} disabled={isLoading}>
									{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									Check Status
								</Button>
							</>
						) : (
							<div className="space-y-6">
								{/* Status Display */}
								<div className={`rounded-lg p-6 text-center ${statusConfig?.bgColor}`}>
									<div className={`mx-auto mb-4 ${statusConfig?.color}`}>{statusConfig?.icon}</div>
									<h3 className="text-lg font-semibold mb-2">{statusConfig?.title}</h3>
									<p className="text-sm text-muted-foreground">{statusConfig?.description}</p>
								</div>

								{/* Application Details */}
								<div className="space-y-3 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Business Name</span>
										<span className="font-medium">{application.businessName}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Email</span>
										<span className="font-medium">{application.email}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Submitted</span>
										<span className="font-medium">{new Date(application.submittedAt).toLocaleDateString()}</span>
									</div>
									{application.reviewedAt && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">Reviewed</span>
											<span className="font-medium">{new Date(application.reviewedAt).toLocaleDateString()}</span>
										</div>
									)}
								</div>

								{/* Rejection Reason */}
								{application.status === "rejected" && application.rejectionReason && (
									<div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4">
										<p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Reason for rejection:</p>
										<p className="text-sm text-red-700 dark:text-red-300">{application.rejectionReason}</p>
									</div>
								)}

								{/* Actions */}
								<div className="flex flex-col gap-2">
									{application.status === "approved" && (
										<Link to="/partner/login" className="w-full">
											<Button className="w-full">Login to Partner Dashboard</Button>
										</Link>
									)}
									{application.status === "rejected" && (
										<Link to="/partner/register" className="w-full">
											<Button className="w-full">Submit New Application</Button>
										</Link>
									)}
									<Button
										variant="outline"
										className="w-full"
										onClick={() => {
											setHasChecked(false);
											setApplication(null);
										}}
									>
										Check Another Email
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
