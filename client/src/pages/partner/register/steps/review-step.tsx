import {
	Building2,
	Car,
	CheckCircle,
	Clock,
	FileText,
	Image,
	Loader2,
	Mail,
	MapPin,
	Phone,
	User,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import partnerAuthService from "@/api/services/partnerAuthService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Separator } from "@/ui/separator";
import { usePartnerRegistration } from "../context/registration-context";

export function ReviewStep() {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const {
		businessInfo,
		documents,
		drivers,
		businessDetails,
		schedule,
		getFormData,
		prevStep,
		setCurrentStep,
	} = usePartnerRegistration();

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			const formData = getFormData();
			await partnerAuthService.registerPartner(formData);
			toast.success("Application submitted successfully!");
			navigate("/partner/application-status", {
				state: { email: businessInfo.email },
			});
		} catch (error) {
			toast.error("Failed to submit application. Please try again.");
			console.error("Registration error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold">Review Your Application</h2>
				<p className="text-muted-foreground">
					Please review all information before submitting
				</p>
			</div>

			{/* Business Information */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Building2 className="h-5 w-5 text-primary" />
							Business Information
						</CardTitle>
						<Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
							Edit
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="grid gap-3 md:grid-cols-2">
						<div>
							<p className="text-sm text-muted-foreground">Business Name</p>
							<p className="font-medium">{businessInfo.businessName}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">License Number</p>
							<p className="font-medium">
								{businessInfo.businessLicenseNumber}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Contact Person</p>
							<p className="font-medium flex items-center gap-1">
								<User className="h-4 w-4" />
								{businessInfo.contactPersonName}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Phone</p>
							<p className="font-medium flex items-center gap-1">
								<Phone className="h-4 w-4" />
								{businessInfo.phone}
							</p>
						</div>
						<div className="md:col-span-2">
							<p className="text-sm text-muted-foreground">Email</p>
							<p className="font-medium flex items-center gap-1">
								<Mail className="h-4 w-4" />
								{businessInfo.email}
							</p>
						</div>
						<div className="md:col-span-2">
							<p className="text-sm text-muted-foreground">Address</p>
							<p className="font-medium flex items-center gap-1">
								<MapPin className="h-4 w-4" />
								{businessInfo.address}
							</p>
						</div>
						<div className="md:col-span-2">
							<p className="text-sm text-muted-foreground">Password</p>
							<p className="font-medium flex items-center gap-1 text-green-600">
								<CheckCircle className="h-4 w-4" />
								Password set
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Documents */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2 text-lg">
							<FileText className="h-5 w-5 text-primary" />
							Uploaded Documents
						</CardTitle>
						<Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
							Edit
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 md:grid-cols-3">
						<div className="flex items-center gap-2 rounded-lg border p-3">
							<CheckCircle className="h-5 w-5 text-green-500" />
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium">Business Registration</p>
								<p className="text-xs text-muted-foreground truncate">
									{documents.businessRegistration?.name}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 rounded-lg border p-3">
							<CheckCircle className="h-5 w-5 text-green-500" />
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium">Business Insurance</p>
								<p className="text-xs text-muted-foreground truncate">
									{documents.businessInsurance?.name}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 rounded-lg border p-3">
							<CheckCircle className="h-5 w-5 text-green-500" />
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium">Motor Trade Insurance</p>
								<p className="text-xs text-muted-foreground truncate">
									{documents.motorTradeInsurance?.name}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Drivers */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Car className="h-5 w-5 text-primary" />
							Drivers ({drivers.length})
						</CardTitle>
						<Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
							Edit
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 md:grid-cols-2">
						{drivers.map((driver, index) => (
							<div
								key={driver.id}
								className="flex items-center gap-3 rounded-lg border p-3"
							>
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
									{index + 1}
								</div>
								<div className="flex-1">
									<p className="font-medium">{driver.fullName}</p>
									<p className="text-sm text-muted-foreground">
										{driver.contactNumber}
									</p>
								</div>
								<div className="flex gap-1">
									{driver.driverLicense && (
										<Badge variant="outline" className="text-xs">
											License ✓
										</Badge>
									)}
									{driver.driverInsurance && (
										<Badge variant="outline" className="text-xs">
											Insurance ✓
										</Badge>
									)}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Business Details */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Image className="h-5 w-5 text-primary" />
							Business Details
						</CardTitle>
						<Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)}>
							Edit
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Preview Images */}
					<div className="flex gap-4">
						{businessDetails.logoPreview && (
							<div>
								<p className="text-sm text-muted-foreground mb-2">Logo</p>
								<img
									src={businessDetails.logoPreview}
									alt="Business logo"
									className="h-16 w-16 rounded-lg object-cover border"
								/>
							</div>
						)}
						{businessDetails.coverPhotoPreview && (
							<div className="flex-1">
								<p className="text-sm text-muted-foreground mb-2">
									Cover Photo
								</p>
								<img
									src={businessDetails.coverPhotoPreview}
									alt="Business cover"
									className="h-16 w-full max-w-[200px] rounded-lg object-cover border"
								/>
							</div>
						)}
					</div>

					{/* Work Photos Count */}
					<div>
						<p className="text-sm text-muted-foreground">Work Photos</p>
						<p className="font-medium">
							{businessDetails.workPhotos.length} photos uploaded
						</p>
					</div>

					{/* Description */}
					<div>
						<p className="text-sm text-muted-foreground">Description</p>
						<p className="text-sm mt-1">{businessDetails.description}</p>
					</div>

					<Separator />

					{/* Service Radius */}
					<div className="flex items-center gap-2">
						<MapPin className="h-4 w-4 text-primary" />
						<span className="text-sm text-muted-foreground">
							Service Radius:
						</span>
						<span className="font-medium">
							{businessDetails.serviceRadius} km
						</span>
					</div>

					{/* Working Hours Summary */}
					<div>
						<div className="flex items-center gap-2 mb-2">
							<Clock className="h-4 w-4 text-primary" />
							<span className="text-sm text-muted-foreground">
								Working Hours
							</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{schedule.map((day) => (
								<Badge
									key={day.dayOfWeek}
									variant={day.isEnabled ? "default" : "secondary"}
									className="text-xs"
								>
									{day.dayName.slice(0, 3)}:{" "}
									{day.isEnabled && day.timeBlocks.length > 0
										? day.timeBlocks
												.map((b) => `${b.start}-${b.end}`)
												.join(", ")
										: "Closed"}
								</Badge>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Agreement */}
			<div className="rounded-lg bg-muted/50 p-4">
				<p className="text-sm text-muted-foreground">
					By submitting this application, you agree to PLINDO's{" "}
					<a href="/legal/terms" className="text-primary underline">
						Terms of Service
					</a>{" "}
					and{" "}
					<a href="/legal/privacy" className="text-primary underline">
						Privacy Policy
					</a>
					. You confirm that all information provided is accurate and all
					documents are authentic.
				</p>
			</div>

			<div className="flex justify-between pt-4">
				<Button
					type="button"
					variant="outline"
					onClick={prevStep}
					disabled={isSubmitting}
				>
					Back
				</Button>
				<Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Submit Application
				</Button>
			</div>
		</div>
	);
}
