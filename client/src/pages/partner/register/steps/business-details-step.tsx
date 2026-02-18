import { Camera, Clock, MapPin, Plus, X } from "lucide-react";
import { useRef } from "react";
import type { WeeklyWorkingHours, WorkingHoursDay } from "@/types/partner";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Slider } from "@/ui/slider";
import { Switch } from "@/ui/switch";
import { Textarea } from "@/ui/textarea";
import { usePartnerRegistration } from "../context/registration-context";

const DAYS_OF_WEEK: (keyof WeeklyWorkingHours)[] = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
];

const DAY_LABELS: Record<keyof WeeklyWorkingHours, string> = {
	monday: "Monday",
	tuesday: "Tuesday",
	wednesday: "Wednesday",
	thursday: "Thursday",
	friday: "Friday",
	saturday: "Saturday",
	sunday: "Sunday",
};

interface ImageUploadProps {
	label: string;
	description: string;
	file: File | null;
	preview?: string;
	onFileChange: (file: File | null, preview?: string) => void;
	aspectRatio?: string;
}

function ImageUploadBox({
	label,
	description,
	preview,
	onFileChange,
	aspectRatio = "aspect-square",
}: ImageUploadProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			const reader = new FileReader();
			reader.onloadend = () => {
				onFileChange(selectedFile, reader.result as string);
			};
			reader.readAsDataURL(selectedFile);
		}
	};

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<p className="text-xs text-muted-foreground">{description}</p>
			<div
				className={`relative ${aspectRatio} w-full overflow-hidden rounded-lg border-2 border-dashed hover:border-primary cursor-pointer transition-colors`}
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
				role="button"
				tabIndex={0}
			>
				<input ref={inputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
				{preview ? (
					<>
						<img src={preview} alt={label} className="h-full w-full object-cover" />
						<Button
							type="button"
							variant="destructive"
							size="icon"
							className="absolute right-2 top-2 h-8 w-8"
							onClick={(e) => {
								e.stopPropagation();
								onFileChange(null, undefined);
							}}
						>
							<X className="h-4 w-4" />
						</Button>
					</>
				) : (
					<div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
						<Camera className="h-8 w-8 mb-2" />
						<span className="text-sm">Click to upload</span>
					</div>
				)}
			</div>
		</div>
	);
}

interface WorkingHoursDayRowProps {
	day: keyof WeeklyWorkingHours;
	hours: WorkingHoursDay;
	onChange: (hours: WorkingHoursDay) => void;
}

function WorkingHoursDayRow({ day, hours, onChange }: WorkingHoursDayRowProps) {
	return (
		<div className="flex items-center gap-4 py-2">
			<div className="w-24">
				<span className="text-sm font-medium">{DAY_LABELS[day]}</span>
			</div>
			<Switch checked={hours.isOpen} onCheckedChange={(isOpen) => onChange({ ...hours, isOpen })} />
			{hours.isOpen ? (
				<div className="flex items-center gap-2 flex-1">
					<Input
						type="time"
						value={hours.openTime}
						onChange={(e) => onChange({ ...hours, openTime: e.target.value })}
						className="w-28"
					/>
					<span className="text-muted-foreground">to</span>
					<Input
						type="time"
						value={hours.closeTime}
						onChange={(e) => onChange({ ...hours, closeTime: e.target.value })}
						className="w-28"
					/>
				</div>
			) : (
				<span className="text-sm text-muted-foreground">Closed</span>
			)}
		</div>
	);
}

export function BusinessDetailsStep() {
	const { businessDetails, setBusinessDetails, nextStep, prevStep } = usePartnerRegistration();
	const workPhotosInputRef = useRef<HTMLInputElement>(null);

	const handleLogoChange = (file: File | null, preview?: string) => {
		setBusinessDetails({
			...businessDetails,
			logo: file,
			logoPreview: preview,
		});
	};

	const handleCoverChange = (file: File | null, preview?: string) => {
		setBusinessDetails({
			...businessDetails,
			coverPhoto: file,
			coverPhotoPreview: preview,
		});
	};

	const handleWorkPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		const remainingSlots = 10 - businessDetails.workPhotos.length;
		const newFiles = files.slice(0, remainingSlots);

		const newPreviews: string[] = [];
		let processedCount = 0;

		newFiles.forEach((file) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				newPreviews.push(reader.result as string);
				processedCount++;
				if (processedCount === newFiles.length) {
					setBusinessDetails({
						...businessDetails,
						workPhotos: [...businessDetails.workPhotos, ...newFiles],
						workPhotosPreview: [...businessDetails.workPhotosPreview, ...newPreviews],
					});
				}
			};
			reader.readAsDataURL(file);
		});
	};

	const removeWorkPhoto = (index: number) => {
		setBusinessDetails({
			...businessDetails,
			workPhotos: businessDetails.workPhotos.filter((_, i) => i !== index),
			workPhotosPreview: businessDetails.workPhotosPreview.filter((_, i) => i !== index),
		});
	};

	const updateWorkingHours = (day: keyof WeeklyWorkingHours, hours: WorkingHoursDay) => {
		setBusinessDetails({
			...businessDetails,
			workingHours: {
				...businessDetails.workingHours,
				[day]: hours,
			},
		});
	};

	const isComplete =
		businessDetails.logo !== null &&
		businessDetails.coverPhoto !== null &&
		businessDetails.description.trim().length >= 50;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold">Business Details</h2>
				<p className="text-muted-foreground">Add your business branding and set your working hours</p>
			</div>

			{/* Logo and Cover Photo */}
			<div className="grid gap-6 md:grid-cols-2">
				<ImageUploadBox
					label="Business Logo *"
					description="Square image, min 200x200px"
					file={businessDetails.logo}
					preview={businessDetails.logoPreview}
					onFileChange={handleLogoChange}
					aspectRatio="aspect-square max-w-[200px]"
				/>

				<ImageUploadBox
					label="Cover Photo *"
					description="Wide image for your profile banner"
					file={businessDetails.coverPhoto}
					preview={businessDetails.coverPhotoPreview}
					onFileChange={handleCoverChange}
					aspectRatio="aspect-video"
				/>
			</div>

			{/* Work Photos Gallery */}
			<div className="space-y-2">
				<Label>Work Photos (up to 10)</Label>
				<p className="text-xs text-muted-foreground">Showcase your facility and work quality</p>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
					{businessDetails.workPhotosPreview.map((preview, index) => (
						<div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
							<img src={preview} alt={`Work photo ${index + 1}`} className="h-full w-full object-cover" />
							<Button
								type="button"
								variant="destructive"
								size="icon"
								className="absolute right-1 top-1 h-6 w-6"
								onClick={() => removeWorkPhoto(index)}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					))}
					{businessDetails.workPhotos.length < 10 && (
						<div
							className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
							onClick={() => workPhotosInputRef.current?.click()}
							onKeyDown={(e) => e.key === "Enter" && workPhotosInputRef.current?.click()}
							role="button"
							tabIndex={0}
						>
							<input
								ref={workPhotosInputRef}
								type="file"
								accept="image/*"
								multiple
								onChange={handleWorkPhotosChange}
								className="hidden"
							/>
							<Plus className="h-6 w-6 text-muted-foreground" />
							<span className="text-xs text-muted-foreground mt-1">Add Photo</span>
						</div>
					)}
				</div>
			</div>

			{/* Description */}
			<div className="space-y-2">
				<Label htmlFor="description">Business Description *</Label>
				<Textarea
					id="description"
					placeholder="Describe your car wash services, specialties, and what makes you unique..."
					value={businessDetails.description}
					onChange={(e) => setBusinessDetails({ ...businessDetails, description: e.target.value })}
					rows={4}
					maxLength={500}
				/>
				<p className="text-xs text-muted-foreground text-right">
					{businessDetails.description.length}/500 characters (min 50)
				</p>
			</div>

			{/* Service Radius */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center gap-2 mb-4">
						<MapPin className="h-5 w-5 text-primary" />
						<Label>Service Radius</Label>
					</div>
					<p className="text-sm text-muted-foreground mb-4">How far are you willing to travel to pick up vehicles?</p>
					<div className="flex items-center gap-4">
						<Slider
							value={[businessDetails.serviceRadius]}
							onValueChange={([value]) => setBusinessDetails({ ...businessDetails, serviceRadius: value })}
							max={50}
							min={1}
							step={1}
							className="flex-1"
						/>
						<span className="w-20 text-right font-semibold">{businessDetails.serviceRadius} km</span>
					</div>
				</CardContent>
			</Card>

			{/* Working Hours */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center gap-2 mb-4">
						<Clock className="h-5 w-5 text-primary" />
						<Label>Working Hours</Label>
					</div>
					<div className="divide-y">
						{DAYS_OF_WEEK.map((day) => (
							<WorkingHoursDayRow
								key={day}
								day={day}
								hours={businessDetails.workingHours[day]}
								onChange={(hours) => updateWorkingHours(day, hours)}
							/>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-between pt-4">
				<Button type="button" variant="outline" onClick={prevStep}>
					Back
				</Button>
				<Button type="button" onClick={nextStep} disabled={!isComplete}>
					Review Application
				</Button>
			</div>
		</div>
	);
}
