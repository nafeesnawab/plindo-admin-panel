import { Camera, MapPin, Plus, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Slider } from "@/ui/slider";
import { Textarea } from "@/ui/textarea";
import { usePartnerRegistration } from "../context/registration-context";

interface ImageUploadProps {
	label: string;
	description: string;
	file: File | null;
	preview?: string;
	onFileChange: (file: File | null, preview?: string) => void;
	aspectRatio?: string;
}

function ImageUploadBox({ label, description, preview, onFileChange, aspectRatio = "aspect-square" }: ImageUploadProps) {
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
			<div
				className={`relative ${aspectRatio} w-full max-w-xs cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors`}
				onClick={() => inputRef.current?.click()}
			>
				{preview ? (
					<>
						<img src={preview} alt={label} className="h-full w-full object-cover" />
						<button
							type="button"
							className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
							onClick={(e) => {
								e.stopPropagation();
								onFileChange(null);
							}}
						>
							<X className="h-4 w-4" />
						</button>
					</>
				) : (
					<div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
						<Camera className="h-8 w-8" />
						<p className="text-center text-xs">{description}</p>
					</div>
				)}
			</div>
			<input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
		</div>
	);
}

export function BusinessDetailsStep() {
	const { businessDetails, setBusinessDetails, nextStep, prevStep } = usePartnerRegistration();

	const handleNext = () => {
		nextStep();
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold">Business Details</h2>
				<p className="text-muted-foreground">Add your business description, logo, and photos</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Business Description *</Label>
				<Textarea
					id="description"
					placeholder="Describe your car wash and detailing services..."
					value={businessDetails.description}
					onChange={(e) => setBusinessDetails({ ...businessDetails, description: e.target.value })}
					rows={4}
				/>
			</div>

			<div className="space-y-2">
				<Label>Service Radius</Label>
				<div className="flex items-center gap-4">
					<MapPin className="h-5 w-5 text-muted-foreground" />
					<Slider
						value={[businessDetails.serviceRadius]}
						onValueChange={([value]) => setBusinessDetails({ ...businessDetails, serviceRadius: value })}
						min={1}
						max={50}
						step={1}
						className="flex-1"
					/>
					<span className="text-sm font-medium w-16 text-right">{businessDetails.serviceRadius} km</span>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<ImageUploadBox
					label="Business Logo"
					description="Click to upload logo"
					file={businessDetails.logo}
					preview={businessDetails.logoPreview}
					onFileChange={(file, preview) =>
						setBusinessDetails({ ...businessDetails, logo: file, logoPreview: preview })
					}
				/>

				<ImageUploadBox
					label="Cover Photo"
					description="Click to upload cover photo"
					file={businessDetails.coverPhoto}
					preview={businessDetails.coverPhotoPreview}
					onFileChange={(file, preview) =>
						setBusinessDetails({ ...businessDetails, coverPhoto: file, coverPhotoPreview: preview })
					}
					aspectRatio="aspect-video"
				/>
			</div>

			<div className="space-y-2">
				<Label>Work Photos (Optional)</Label>
				<div className="grid gap-4 grid-cols-2 md:grid-cols-3">
					{businessDetails.workPhotosPreview.map((preview, index) => (
						<div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
							<img src={preview} alt={`Work ${index + 1}`} className="h-full w-full object-cover" />
							<button
								type="button"
								className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
								onClick={() => {
									const newPhotos = [...businessDetails.workPhotos];
									const newPreviews = [...businessDetails.workPhotosPreview];
									newPhotos.splice(index, 1);
									newPreviews.splice(index, 1);
									setBusinessDetails({
										...businessDetails,
										workPhotos: newPhotos,
										workPhotosPreview: newPreviews,
									});
								}}
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
					{businessDetails.workPhotos.length < 6 && (
						<label className="aspect-video cursor-pointer rounded-lg border-2 border-dashed hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground">
							<Plus className="h-6 w-6" />
							<span className="text-xs">Add Photo</span>
							<input
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) {
										const reader = new FileReader();
										reader.onloadend = () => {
											setBusinessDetails({
												...businessDetails,
												workPhotos: [...businessDetails.workPhotos, file],
												workPhotosPreview: [...businessDetails.workPhotosPreview, reader.result as string],
											});
										};
										reader.readAsDataURL(file);
									}
								}}
							/>
						</label>
					)}
				</div>
			</div>

			<div className="flex justify-between pt-4">
				<Button type="button" variant="outline" onClick={prevStep}>
					Back
				</Button>
				<Button type="button" onClick={handleNext} disabled={!businessDetails.description.trim()}>
					Continue
				</Button>
			</div>
		</div>
	);
}
