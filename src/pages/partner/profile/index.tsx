import {
	AlertTriangle,
	Calendar,
	Clock,
	Facebook,
	FileText,
	GripVertical,
	Image,
	Instagram,
	Link2,
	Mail,
	MapPin,
	Phone,
	Plus,
	Save,
	ShieldCheck,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Slider } from "@/ui/slider";
import { Switch } from "@/ui/switch";
import { Textarea } from "@/ui/textarea";
import { cn } from "@/utils";

// Types
interface BusinessHours {
	day: string;
	isOpen: boolean;
	openTime: string;
	closeTime: string;
}

interface Holiday {
	id: string;
	name: string;
	date: string;
}

interface Document {
	id: string;
	type: "business_registration" | "business_insurance" | "motor_trade_insurance";
	name: string;
	url: string;
	expiryDate: string;
	status: "pending" | "approved" | "rejected" | "expired";
	uploadedAt: string;
}

interface GalleryImage {
	id: string;
	url: string;
	order: number;
}

interface BusinessProfile {
	name: string;
	description: string;
	logoUrl: string;
	coverPhotoUrl: string;
	gallery: GalleryImage[];
	phone: string;
	email: string;
	address: string;
	latitude: number;
	longitude: number;
	serviceRadius: number;
	businessHours: BusinessHours[];
	holidays: Holiday[];
	documents: Document[];
	socialMedia: {
		facebook: string;
		instagram: string;
	};
}

// Mock data
const mockProfile: BusinessProfile = {
	name: "Premium Auto Detailing",
	description:
		"Professional mobile car wash and detailing service. We bring the car wash to you with eco-friendly products and exceptional results. Over 10 years of experience serving the Dublin area.",
	logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
	coverPhotoUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1200&h=400&fit=crop",
	gallery: [
		{ id: "g1", url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400", order: 1 },
		{ id: "g2", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", order: 2 },
		{ id: "g3", url: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400", order: 3 },
	],
	phone: "+353 86 123 4567",
	email: "info@premiumautodetailing.ie",
	address: "123 Main Street, Dublin 2, D02 AB12, Ireland",
	latitude: 53.3498,
	longitude: -6.2603,
	serviceRadius: 25,
	businessHours: [
		{ day: "Monday", isOpen: true, openTime: "08:00", closeTime: "18:00" },
		{ day: "Tuesday", isOpen: true, openTime: "08:00", closeTime: "18:00" },
		{ day: "Wednesday", isOpen: true, openTime: "08:00", closeTime: "18:00" },
		{ day: "Thursday", isOpen: true, openTime: "08:00", closeTime: "18:00" },
		{ day: "Friday", isOpen: true, openTime: "08:00", closeTime: "18:00" },
		{ day: "Saturday", isOpen: true, openTime: "09:00", closeTime: "16:00" },
		{ day: "Sunday", isOpen: false, openTime: "09:00", closeTime: "16:00" },
	],
	holidays: [
		{ id: "h1", name: "Christmas Day", date: "2025-12-25" },
		{ id: "h2", name: "New Year's Day", date: "2026-01-01" },
	],
	documents: [
		{
			id: "doc1",
			type: "business_registration",
			name: "Business Registration Certificate",
			url: "/uploads/business-reg.pdf",
			expiryDate: "2026-06-15",
			status: "approved",
			uploadedAt: "2024-06-15",
		},
		{
			id: "doc2",
			type: "business_insurance",
			name: "Business Insurance Policy",
			url: "/uploads/business-insurance.pdf",
			expiryDate: "2025-03-20",
			status: "approved",
			uploadedAt: "2024-03-20",
		},
		{
			id: "doc3",
			type: "motor_trade_insurance",
			name: "Motor Trade Insurance",
			url: "/uploads/motor-trade.pdf",
			expiryDate: "2025-01-15",
			status: "expired",
			uploadedAt: "2024-01-15",
		},
	],
	socialMedia: {
		facebook: "https://facebook.com/premiumautodetailing",
		instagram: "https://instagram.com/premiumautodetailing",
	},
};

// Helper functions
const isExpiringSoon = (dateStr: string): boolean => {
	const expiryDate = new Date(dateStr);
	const now = new Date();
	const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
	return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
};

const isExpired = (dateStr: string): boolean => {
	return new Date(dateStr) < new Date();
};

const formatDate = (dateStr: string): string => {
	return new Date(dateStr).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

const getDocumentStatusBadge = (doc: Document) => {
	if (isExpired(doc.expiryDate)) {
		return <Badge variant="destructive">Expired</Badge>;
	}
	if (isExpiringSoon(doc.expiryDate)) {
		return (
			<Badge variant="outline" className="border-orange-500 text-orange-500">
				Expiring Soon
			</Badge>
		);
	}
	switch (doc.status) {
		case "approved":
			return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
		case "pending":
			return (
				<Badge variant="outline" className="border-yellow-500 text-yellow-600">
					Pending Review
				</Badge>
			);
		case "rejected":
			return <Badge variant="destructive">Rejected</Badge>;
		default:
			return null;
	}
};

const getDocumentIcon = (type: Document["type"]) => {
	switch (type) {
		case "business_registration":
			return <FileText className="h-5 w-5" />;
		case "business_insurance":
			return <ShieldCheck className="h-5 w-5" />;
		case "motor_trade_insurance":
			return <ShieldCheck className="h-5 w-5" />;
		default:
			return <FileText className="h-5 w-5" />;
	}
};

export default function PartnerBusinessProfile() {
	const [profile, setProfile] = useState<BusinessProfile>(mockProfile);
	const [isEditing, setIsEditing] = useState(false);
	const [editForm, setEditForm] = useState<BusinessProfile>(mockProfile);
	const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
	const [newHoliday, setNewHoliday] = useState({ name: "", date: "" });
	const [isSaving, setIsSaving] = useState(false);

	// Handle save profile
	const handleSaveProfile = async () => {
		setIsSaving(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		setProfile(editForm);
		setIsEditing(false);
		setIsSaving(false);
		toast.success("Business profile updated successfully");
	};

	// Handle cancel edit
	const handleCancelEdit = () => {
		setEditForm(profile);
		setIsEditing(false);
	};

	// Handle business hours change
	const handleHoursChange = (index: number, field: keyof BusinessHours, value: string | boolean) => {
		const updatedHours = [...editForm.businessHours];
		updatedHours[index] = { ...updatedHours[index], [field]: value };
		setEditForm({ ...editForm, businessHours: updatedHours });
	};

	// Handle add holiday
	const handleAddHoliday = () => {
		if (!newHoliday.name || !newHoliday.date) {
			toast.error("Please fill in all fields");
			return;
		}
		const holiday: Holiday = {
			id: `h-${Date.now()}`,
			name: newHoliday.name,
			date: newHoliday.date,
		};
		setEditForm({ ...editForm, holidays: [...editForm.holidays, holiday] });
		setNewHoliday({ name: "", date: "" });
		setHolidayDialogOpen(false);
		toast.success("Holiday added");
	};

	// Handle remove holiday
	const handleRemoveHoliday = (id: string) => {
		setEditForm({
			...editForm,
			holidays: editForm.holidays.filter((h) => h.id !== id),
		});
		toast.success("Holiday removed");
	};

	// Handle remove gallery image
	const handleRemoveGalleryImage = (id: string) => {
		setEditForm({
			...editForm,
			gallery: editForm.gallery.filter((g) => g.id !== id),
		});
	};

	// Count document issues
	const documentIssues = profile.documents.filter((d) => isExpired(d.expiryDate) || d.status === "rejected").length;

	const currentForm = isEditing ? editForm : profile;

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Business Profile</h1>
					<p className="text-muted-foreground">Manage your business information and documents</p>
				</div>
				{isEditing ? (
					<div className="flex gap-2">
						<Button variant="outline" onClick={handleCancelEdit}>
							Cancel
						</Button>
						<Button onClick={handleSaveProfile} disabled={isSaving}>
							<Save className="mr-2 h-4 w-4" />
							{isSaving ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				) : (
					<Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
				)}
			</div>

			{/* Document Alert */}
			{documentIssues > 0 && (
				<Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
					<CardContent className="flex items-center gap-3 py-4">
						<AlertTriangle className="h-5 w-5 text-orange-500" />
						<div>
							<p className="font-medium text-orange-700 dark:text-orange-400">Document Action Required</p>
							<p className="text-sm text-orange-600 dark:text-orange-500">
								{documentIssues} document(s) need attention. Please upload updated documents.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Cover Photo & Logo */}
			<Card>
				<CardContent className="p-0">
					{/* Cover Photo */}
					<div className="relative h-48 bg-muted overflow-hidden rounded-t-lg">
						{currentForm.coverPhotoUrl ? (
							<img src={currentForm.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<Image className="h-12 w-12 text-muted-foreground" />
							</div>
						)}
						{isEditing && (
							<Button variant="secondary" size="sm" className="absolute bottom-4 right-4" type="button">
								<Upload className="mr-2 h-4 w-4" />
								Change Cover
							</Button>
						)}
					</div>

					{/* Logo & Basic Info */}
					<div className="relative px-6 pb-6">
						<div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
							{/* Logo */}
							<div className="relative">
								<div className="h-24 w-24 rounded-xl border-4 border-background overflow-hidden bg-muted">
									{currentForm.logoUrl ? (
										<img src={currentForm.logoUrl} alt="Logo" className="w-full h-full object-cover" />
									) : (
										<div className="w-full h-full flex items-center justify-center">
											<Image className="h-8 w-8 text-muted-foreground" />
										</div>
									)}
								</div>
								{isEditing && (
									<Button
										variant="secondary"
										size="icon"
										className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
										type="button"
									>
										<Upload className="h-4 w-4" />
									</Button>
								)}
							</div>

							{/* Business Name & Description */}
							<div className="flex-1 pt-4 sm:pt-0">
								{isEditing ? (
									<div className="space-y-3">
										<Input
											value={editForm.name}
											onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
											placeholder="Business name"
											className="text-xl font-bold h-auto py-2"
										/>
										<Textarea
											value={editForm.description}
											onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
											placeholder="Business description"
											className="resize-none"
											rows={3}
										/>
									</div>
								) : (
									<div>
										<h2 className="text-xl font-bold">{profile.name}</h2>
										<p className="text-muted-foreground mt-1">{profile.description}</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Contact Information */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Contact Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Phone className="h-4 w-4 text-muted-foreground" />
								Phone
							</Label>
							{isEditing ? (
								<Input
									value={editForm.phone}
									onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
									placeholder="+353 86 123 4567"
								/>
							) : (
								<p className="text-sm">{profile.phone}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Mail className="h-4 w-4 text-muted-foreground" />
								Email
							</Label>
							{isEditing ? (
								<Input
									type="email"
									value={editForm.email}
									onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
									placeholder="info@business.com"
								/>
							) : (
								<p className="text-sm">{profile.email}</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Location & Service Radius */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Location & Service Area</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								Business Address
							</Label>
							{isEditing ? (
								<Textarea
									value={editForm.address}
									onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
									placeholder="Enter your business address"
									rows={2}
								/>
							) : (
								<p className="text-sm">{profile.address}</p>
							)}
						</div>
						{isEditing && (
							<Button variant="outline" className="w-full" type="button">
								<MapPin className="mr-2 h-4 w-4" />
								Update Location on Map
							</Button>
						)}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label>Service Radius</Label>
								<span className="text-sm font-medium">{currentForm.serviceRadius} km</span>
							</div>
							{isEditing ? (
								<Slider
									value={[editForm.serviceRadius]}
									onValueChange={(value) => setEditForm({ ...editForm, serviceRadius: value[0] })}
									min={5}
									max={50}
									step={5}
								/>
							) : (
								<div className="h-2 bg-muted rounded-full overflow-hidden">
									<div className="h-full bg-primary" style={{ width: `${(profile.serviceRadius / 50) * 100}%` }} />
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Gallery */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-base">Gallery</CardTitle>
								<CardDescription>{currentForm.gallery.length}/10 photos</CardDescription>
							</div>
							{isEditing && currentForm.gallery.length < 10 && (
								<Button variant="outline" size="sm" type="button">
									<Plus className="mr-2 h-4 w-4" />
									Add Photo
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						{currentForm.gallery.length === 0 ? (
							<div className="border-2 border-dashed rounded-lg p-8 text-center">
								<Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<p className="text-muted-foreground">No photos added yet</p>
								{isEditing && (
									<Button variant="outline" className="mt-4" type="button">
										<Upload className="mr-2 h-4 w-4" />
										Upload Photos
									</Button>
								)}
							</div>
						) : (
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
								{currentForm.gallery.map((image) => (
									<div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
										<img src={image.url} alt="Gallery" className="w-full h-full object-cover" />
										{isEditing && (
											<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
												<Button variant="secondary" size="icon" className="h-8 w-8" type="button">
													<GripVertical className="h-4 w-4" />
												</Button>
												<Button
													variant="destructive"
													size="icon"
													className="h-8 w-8"
													onClick={() => handleRemoveGalleryImage(image.id)}
													type="button"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Verification Documents */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Verification Documents</CardTitle>
						<CardDescription>Documents required for business verification</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{profile.documents.map((doc) => (
							<div
								key={doc.id}
								className={cn(
									"flex items-start gap-4 p-4 rounded-lg border",
									(isExpired(doc.expiryDate) || doc.status === "rejected") && "border-destructive/50 bg-destructive/5",
								)}
							>
								<div
									className={cn(
										"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
										isExpired(doc.expiryDate) || doc.status === "rejected"
											? "bg-destructive/10 text-destructive"
											: "bg-primary/10 text-primary",
									)}
								>
									{getDocumentIcon(doc.type)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-2">
										<div>
											<p className="font-medium">{doc.name}</p>
											<p className="text-sm text-muted-foreground">Expires: {formatDate(doc.expiryDate)}</p>
										</div>
										{getDocumentStatusBadge(doc)}
									</div>
									{(isExpired(doc.expiryDate) || doc.status === "rejected") && (
										<Button variant="outline" size="sm" className="mt-3" type="button">
											<Upload className="mr-2 h-4 w-4" />
											Upload New Document
										</Button>
									)}
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				{/* Business Hours */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Business Hours</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{currentForm.businessHours.map((hours, index) => (
							<div key={hours.day} className="flex items-center gap-4">
								<div className="w-24 text-sm font-medium">{hours.day}</div>
								{isEditing ? (
									<>
										<Switch
											checked={editForm.businessHours[index].isOpen}
											onCheckedChange={(checked) => handleHoursChange(index, "isOpen", checked)}
										/>
										{editForm.businessHours[index].isOpen ? (
											<div className="flex items-center gap-2 flex-1">
												<Select
													value={editForm.businessHours[index].openTime}
													onValueChange={(v) => handleHoursChange(index, "openTime", v)}
												>
													<SelectTrigger className="w-24">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{Array.from({ length: 24 }, (_, i) => {
															const time = `${i.toString().padStart(2, "0")}:00`;
															return (
																<SelectItem key={time} value={time}>
																	{time}
																</SelectItem>
															);
														})}
													</SelectContent>
												</Select>
												<span className="text-muted-foreground">to</span>
												<Select
													value={editForm.businessHours[index].closeTime}
													onValueChange={(v) => handleHoursChange(index, "closeTime", v)}
												>
													<SelectTrigger className="w-24">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{Array.from({ length: 24 }, (_, i) => {
															const time = `${i.toString().padStart(2, "0")}:00`;
															return (
																<SelectItem key={time} value={time}>
																	{time}
																</SelectItem>
															);
														})}
													</SelectContent>
												</Select>
											</div>
										) : (
											<span className="text-sm text-muted-foreground">Closed</span>
										)}
									</>
								) : (
									<div className="flex items-center gap-2 text-sm">
										{hours.isOpen ? (
											<>
												<Clock className="h-4 w-4 text-muted-foreground" />
												<span>
													{hours.openTime} - {hours.closeTime}
												</span>
											</>
										) : (
											<span className="text-muted-foreground">Closed</span>
										)}
									</div>
								)}
							</div>
						))}
					</CardContent>
				</Card>

				{/* Holidays */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-base">Holidays & Closed Days</CardTitle>
								<CardDescription>Days when you won't accept bookings</CardDescription>
							</div>
							{isEditing && (
								<Button variant="outline" size="sm" onClick={() => setHolidayDialogOpen(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Add Holiday
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						{currentForm.holidays.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-4">No holidays added</p>
						) : (
							<div className="space-y-2">
								{currentForm.holidays.map((holiday) => (
									<div key={holiday.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
										<div className="flex items-center gap-3">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="font-medium text-sm">{holiday.name}</p>
												<p className="text-xs text-muted-foreground">{formatDate(holiday.date)}</p>
											</div>
										</div>
										{isEditing && (
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-muted-foreground hover:text-destructive"
												onClick={() => handleRemoveHoliday(holiday.id)}
											>
												<X className="h-4 w-4" />
											</Button>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Social Media Links */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Social Media Links</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Facebook className="h-4 w-4 text-blue-600" />
								Facebook
							</Label>
							{isEditing ? (
								<Input
									value={editForm.socialMedia.facebook}
									onChange={(e) =>
										setEditForm({
											...editForm,
											socialMedia: { ...editForm.socialMedia, facebook: e.target.value },
										})
									}
									placeholder="https://facebook.com/yourbusiness"
								/>
							) : profile.socialMedia.facebook ? (
								<a
									href={profile.socialMedia.facebook}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-primary hover:underline flex items-center gap-1"
								>
									{profile.socialMedia.facebook}
									<Link2 className="h-3 w-3" />
								</a>
							) : (
								<p className="text-sm text-muted-foreground">Not set</p>
							)}
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Instagram className="h-4 w-4 text-pink-600" />
								Instagram
							</Label>
							{isEditing ? (
								<Input
									value={editForm.socialMedia.instagram}
									onChange={(e) =>
										setEditForm({
											...editForm,
											socialMedia: { ...editForm.socialMedia, instagram: e.target.value },
										})
									}
									placeholder="https://instagram.com/yourbusiness"
								/>
							) : profile.socialMedia.instagram ? (
								<a
									href={profile.socialMedia.instagram}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-primary hover:underline flex items-center gap-1"
								>
									{profile.socialMedia.instagram}
									<Link2 className="h-3 w-3" />
								</a>
							) : (
								<p className="text-sm text-muted-foreground">Not set</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Add Holiday Dialog */}
			<Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Holiday</DialogTitle>
						<DialogDescription>Add a day when you won't be accepting bookings</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Holiday Name</Label>
							<Input
								value={newHoliday.name}
								onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
								placeholder="e.g., Christmas Day"
							/>
						</div>
						<div className="space-y-2">
							<Label>Date</Label>
							<Input
								type="date"
								value={newHoliday.date}
								onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setHolidayDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleAddHoliday}>Add Holiday</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
