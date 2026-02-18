import { CheckCircle, FileText, Plus, Trash2, Upload, User, X } from "lucide-react";
import type { Driver } from "@/types/partner";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { usePartnerRegistration } from "../context/registration-context";

interface DriverFileUploadProps {
	label: string;
	file: File | null;
	onFileChange: (file: File | null) => void;
}

function DriverFileUpload({ label, file, onFileChange }: DriverFileUploadProps) {
	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			onFileChange(selectedFile);
		}
	};

	return (
		<div className="space-y-1.5">
			<Label className="text-xs">{label}</Label>
			{file ? (
				<div className="flex items-center gap-2 rounded border bg-muted/50 p-2 text-xs">
					<FileText className="h-4 w-4 text-primary" />
					<span className="flex-1 truncate">{file.name}</span>
					<CheckCircle className="h-4 w-4 text-green-500" />
					<Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onFileChange(null)}>
						<X className="h-3 w-3" />
					</Button>
				</div>
			) : (
				<div className="relative">
					<input
						type="file"
						accept=".pdf,.jpg,.jpeg,.png"
						onChange={handleFileInput}
						className="absolute inset-0 cursor-pointer opacity-0"
						id={`driver-file-${label}`}
					/>
					<div className="flex cursor-pointer items-center gap-2 rounded border-2 border-dashed p-2 text-xs hover:border-primary hover:bg-primary/5">
						<Upload className="h-4 w-4 text-muted-foreground" />
						<span className="text-muted-foreground">Upload {label}</span>
					</div>
				</div>
			)}
		</div>
	);
}

interface DriverCardProps {
	driver: Driver;
	index: number;
	canRemove: boolean;
	onUpdate: (data: Partial<Driver>) => void;
	onRemove: () => void;
}

function DriverCard({ driver, index, canRemove, onUpdate, onRemove }: DriverCardProps) {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
							<User className="h-4 w-4 text-primary" />
						</div>
						<span className="font-medium">Driver {index + 1}</span>
					</div>
					{canRemove && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-destructive hover:text-destructive"
							onClick={onRemove}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor={`driver-name-${driver.id}`} className="text-xs">
							Full Name *
						</Label>
						<Input
							id={`driver-name-${driver.id}`}
							placeholder="e.g., John Smith"
							value={driver.fullName}
							onChange={(e) => onUpdate({ fullName: e.target.value })}
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor={`driver-phone-${driver.id}`} className="text-xs">
							Contact Number *
						</Label>
						<Input
							id={`driver-phone-${driver.id}`}
							placeholder="e.g., +357 99 123456"
							value={driver.contactNumber}
							onChange={(e) => onUpdate({ contactNumber: e.target.value })}
						/>
					</div>

					<DriverFileUpload
						label="Driver's License"
						file={driver.driverLicense}
						onFileChange={(file) => onUpdate({ driverLicense: file })}
					/>

					<DriverFileUpload
						label="Driver Insurance"
						file={driver.driverInsurance}
						onFileChange={(file) => onUpdate({ driverInsurance: file })}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

export function DriversStep() {
	const { drivers, addDriver, removeDriver, updateDriver, nextStep, prevStep } = usePartnerRegistration();

	const isDriverComplete = (driver: Driver) => {
		return (
			driver.fullName.trim() !== "" &&
			driver.contactNumber.trim() !== "" &&
			driver.driverLicense !== null &&
			driver.driverInsurance !== null
		);
	};

	const allDriversComplete = drivers.length > 0 && drivers.every(isDriverComplete);

	const handleContinue = () => {
		if (allDriversComplete) {
			nextStep();
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold">Driver Information</h2>
				<p className="text-muted-foreground">
					Add details for all drivers who will be picking up and delivering vehicles
				</p>
			</div>

			<div className="space-y-4">
				{drivers.map((driver, index) => (
					<DriverCard
						key={driver.id}
						driver={driver}
						index={index}
						canRemove={drivers.length > 1}
						onUpdate={(data) => updateDriver(driver.id, data)}
						onRemove={() => removeDriver(driver.id)}
					/>
				))}
			</div>

			<Button type="button" variant="outline" onClick={addDriver} className="w-full">
				<Plus className="mr-2 h-4 w-4" />
				Add Another Driver
			</Button>

			<div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4">
				<p className="text-sm text-blue-800 dark:text-blue-200">
					<strong>Tip:</strong> You can add more drivers later from your partner dashboard after approval.
				</p>
			</div>

			<div className="flex justify-between pt-4">
				<Button type="button" variant="outline" onClick={prevStep}>
					Back
				</Button>
				<Button type="button" onClick={handleContinue} disabled={!allDriversComplete}>
					Continue to Business Details
				</Button>
			</div>
		</div>
	);
}
