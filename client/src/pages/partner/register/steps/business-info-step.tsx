import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { usePartnerRegistration } from "../context/registration-context";

const businessInfoSchema = z.object({
	businessName: z.string().min(2, "Business name must be at least 2 characters"),
	businessLicenseNumber: z.string().min(3, "License number is required"),
	contactPersonName: z.string().min(2, "Contact person name is required"),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(8, "Phone number must be at least 8 characters"),
	address: z.string().min(5, "Address is required"),
});

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

export function BusinessInfoStep() {
	const { businessInfo, setBusinessInfo, nextStep } = usePartnerRegistration();

	const form = useForm<BusinessInfoFormData>({
		resolver: zodResolver(businessInfoSchema),
		defaultValues: {
			businessName: businessInfo.businessName,
			businessLicenseNumber: businessInfo.businessLicenseNumber,
			contactPersonName: businessInfo.contactPersonName,
			email: businessInfo.email,
			phone: businessInfo.phone,
			address: businessInfo.address,
		},
	});

	const onSubmit = (data: BusinessInfoFormData) => {
		setBusinessInfo({
			...businessInfo,
			...data,
		});
		nextStep();
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold">Business Information</h2>
				<p className="text-muted-foreground">Provide basic details about your car wash business</p>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<FormField
							control={form.control}
							name="businessName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Business Name *</FormLabel>
									<FormControl>
										<Input placeholder="e.g., Premium Car Wash Ltd" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="businessLicenseNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Business License Number *</FormLabel>
									<FormControl>
										<Input placeholder="e.g., BL-12345678" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<FormField
							control={form.control}
							name="contactPersonName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Contact Person Name *</FormLabel>
									<FormControl>
										<Input placeholder="e.g., John Smith" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone Number *</FormLabel>
									<FormControl>
										<Input placeholder="e.g., +357 99 123456" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email Address *</FormLabel>
								<FormControl>
									<Input type="email" placeholder="e.g., contact@premiumcarwash.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="address"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Business Address *</FormLabel>
								<FormControl>
									<div className="relative">
										<Input placeholder="e.g., 123 Main Street, Nicosia, Cyprus" {...field} />
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-1 top-1/2 -translate-y-1/2"
											onClick={() => {
												// TODO: Implement map location picker
											}}
										>
											<MapPin className="h-4 w-4" />
										</Button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="rounded-lg border border-dashed p-4 bg-muted/50">
						<div className="flex items-center gap-2 text-muted-foreground">
							<MapPin className="h-5 w-5" />
							<span className="text-sm">
								Map location picker will be available here. You can pin your exact business location.
							</span>
						</div>
						<div className="mt-2 h-48 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
							Google Maps Integration (Coming Soon)
						</div>
					</div>

					<div className="flex justify-end pt-4">
						<Button type="submit">Continue to Documents</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
