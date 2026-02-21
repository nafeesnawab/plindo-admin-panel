import { Check } from "lucide-react";
import { Link } from "react-router";
import Logo from "@/components/logo";
import { GLOBAL_CONFIG } from "@/global-config";
import SettingButton from "@/layouts/components/setting-button";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { cn } from "@/utils";
import { PartnerRegistrationProvider, usePartnerRegistration } from "./context/registration-context";
import { BusinessDetailsStep } from "./steps/business-details-step";
import { BusinessInfoStep } from "./steps/business-info-step";
import { DocumentsStep } from "./steps/documents-step";
import { DriversStep } from "./steps/drivers-step";
import { ScheduleCapacityStep } from "./steps/schedule-capacity-step";
import { ReviewStep } from "./steps/review-step";

const STEPS = [
	{ id: 1, title: "Business Information", description: "Basic details about your business" },
	{ id: 2, title: "Documents", description: "Upload required documents" },
	{ id: 3, title: "Drivers", description: "Add your drivers" },
	{ id: 4, title: "Schedule & Capacity", description: "Working hours & service capacity" },
	{ id: 5, title: "Business Details", description: "Logo, photos & description" },
	{ id: 6, title: "Review & Submit", description: "Review your application" },
];

function RegistrationContent() {
	const { currentStep } = usePartnerRegistration();

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-16 items-center justify-between px-4">
					<Link to="/" className="flex items-center gap-2">
						<Logo size={32} />
						<span className="text-xl font-semibold text-foreground">{GLOBAL_CONFIG.appName.replace("Admin", "Partner")}</span>
					</Link>
					<div className="flex items-center gap-4">
						<Link to="/partner/login">
							<Button variant="ghost">Already registered? Login</Button>
						</Link>
						<SettingButton />
					</div>
				</div>
			</header>

			<main className="container py-8 px-4">
				<div className="mx-auto max-w-5xl">
					{/* Page Title */}
					<div className="mb-8 text-center">
						<h1 className="text-3xl font-bold">Partner Registration</h1>
						<p className="mt-2 text-muted-foreground">
							Join PLINDO and start offering your car wash services to thousands of customers
						</p>
					</div>

					{/* Stepper */}
					<div className="mb-8">
						<div className="flex items-center justify-between">
							{STEPS.map((step, index) => (
								<div key={step.id} className="flex items-center">
									<div className="flex flex-col items-center">
										<div
											className={cn(
												"flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors",
												currentStep > step.id
													? "border-primary bg-primary text-primary-foreground"
													: currentStep === step.id
														? "border-primary bg-primary text-primary-foreground"
														: "border-muted-foreground/30 text-muted-foreground",
											)}
										>
											{currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
										</div>
										<div className="mt-2 hidden text-center md:block">
											<p
												className={cn(
													"text-sm font-medium",
													currentStep >= step.id ? "text-foreground" : "text-muted-foreground",
												)}
											>
												{step.title}
											</p>
											<p className="text-xs text-muted-foreground max-w-[120px]">{step.description}</p>
										</div>
									</div>
									{index < STEPS.length - 1 && (
										<div
											className={cn(
												"mx-2 h-1 w-12 rounded-full md:w-20 lg:w-32",
												currentStep > step.id ? "bg-primary" : "bg-muted",
											)}
										/>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Step Content */}
					<Card>
						<CardContent className="p-6">
							{currentStep === 1 && <BusinessInfoStep />}
							{currentStep === 2 && <DocumentsStep />}
							{currentStep === 3 && <DriversStep />}
							{currentStep === 4 && <ScheduleCapacityStep />}
							{currentStep === 5 && <BusinessDetailsStep />}
							{currentStep === 6 && <ReviewStep />}
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

export default function PartnerRegisterPage() {
	return (
		<PartnerRegistrationProvider>
			<RegistrationContent />
		</PartnerRegistrationProvider>
	);
}
