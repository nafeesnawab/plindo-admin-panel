import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Building2, Mail, MapPin, Phone, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import legalService, { type AboutUs } from "@/api/services/legalService";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Skeleton } from "@/ui/skeleton";

export default function AboutUsPage() {
	const queryClient = useQueryClient();
	const [formData, setFormData] = useState<Partial<AboutUs>>({});

	const { data, isLoading } = useQuery({
		queryKey: ["legal-about"],
		queryFn: () => legalService.getAboutUs(),
	});

	useEffect(() => {
		if (data) {
			setFormData(data);
		}
	}, [data]);

	const updateMutation = useMutation({
		mutationFn: () => legalService.updateAboutUs(formData),
		onSuccess: () => {
			toast.success("About Us updated");
			queryClient.invalidateQueries({ queryKey: ["legal-about"] });
		},
		onError: () => toast.error("Failed to save"),
	});

	const hasChanges = data && JSON.stringify(formData) !== JSON.stringify(data);

	const updateField = <K extends keyof AboutUs>(field: K, value: AboutUs[K]) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const updateSocialLink = (platform: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			socialLinks: { ...prev.socialLinks, [platform]: value } as AboutUs["socialLinks"],
		}));
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<div className="grid grid-cols-2 gap-6">
					<Skeleton className="h-[300px]" />
					<Skeleton className="h-[300px]" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">About Us</h1>
					<p className="text-muted-foreground">
						Last updated: {data?.updatedAt ? format(new Date(data.updatedAt), "PPp") : "Never"}
					</p>
				</div>
				<Button onClick={() => updateMutation.mutate()} disabled={!hasChanges || updateMutation.isPending}>
					<Save className="h-4 w-4 mr-2" />
					Save Changes
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="h-5 w-5" />
							Company Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Company Name</Label>
							<Input value={formData.companyName || ""} onChange={(e) => updateField("companyName", e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label>Tagline</Label>
							<Input value={formData.tagline || ""} onChange={(e) => updateField("tagline", e.target.value)} />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Mail className="h-5 w-5" />
							Contact Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Mail className="h-4 w-4" /> Email
							</Label>
							<Input type="email" value={formData.email || ""} onChange={(e) => updateField("email", e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Phone className="h-4 w-4" /> Phone
							</Label>
							<Input value={formData.phone || ""} onChange={(e) => updateField("phone", e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<MapPin className="h-4 w-4" /> Address
							</Label>
							<Input value={formData.address || ""} onChange={(e) => updateField("address", e.target.value)} />
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Company Description</CardTitle>
					<CardDescription>Rich text content displayed on the About Us page</CardDescription>
				</CardHeader>
				<CardContent>
					<RichTextEditor value={formData.description || ""} onChange={(value) => updateField("description", value)} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Social Links</CardTitle>
					<CardDescription>Social media profile URLs</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Facebook</Label>
							<Input
								value={formData.socialLinks?.facebook || ""}
								onChange={(e) => updateSocialLink("facebook", e.target.value)}
								placeholder="https://facebook.com/..."
							/>
						</div>
						<div className="space-y-2">
							<Label>Twitter</Label>
							<Input
								value={formData.socialLinks?.twitter || ""}
								onChange={(e) => updateSocialLink("twitter", e.target.value)}
								placeholder="https://twitter.com/..."
							/>
						</div>
						<div className="space-y-2">
							<Label>Instagram</Label>
							<Input
								value={formData.socialLinks?.instagram || ""}
								onChange={(e) => updateSocialLink("instagram", e.target.value)}
								placeholder="https://instagram.com/..."
							/>
						</div>
						<div className="space-y-2">
							<Label>LinkedIn</Label>
							<Input
								value={formData.socialLinks?.linkedin || ""}
								onChange={(e) => updateSocialLink("linkedin", e.target.value)}
								placeholder="https://linkedin.com/..."
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
