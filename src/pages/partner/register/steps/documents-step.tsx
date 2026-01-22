import { CheckCircle, FileText, Upload, X } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/ui/button";
import { cn } from "@/utils";
import { usePartnerRegistration } from "../context/registration-context";

interface FileUploadProps {
	label: string;
	description: string;
	file: File | null;
	preview?: string;
	onFileChange: (file: File | null) => void;
	accept?: string;
}

function FileUploadBox({
	label,
	description,
	file,
	preview,
	onFileChange,
	accept = ".pdf,.jpg,.jpeg,.png",
}: FileUploadProps) {
	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const droppedFile = e.dataTransfer.files[0];
			if (droppedFile) {
				onFileChange(droppedFile);
			}
		},
		[onFileChange],
	);

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			onFileChange(selectedFile);
		}
	};

	const removeFile = () => {
		onFileChange(null);
	};

	return (
		<div className="space-y-2">
			<label className="text-sm font-medium">{label} *</label>
			<p className="text-xs text-muted-foreground">{description}</p>

			{file ? (
				<div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<FileText className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium truncate">{file.name}</p>
						<p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
					</div>
					<CheckCircle className="h-5 w-5 text-green-500" />
					<Button type="button" variant="ghost" size="icon" onClick={removeFile} className="h-8 w-8">
						<X className="h-4 w-4" />
					</Button>
				</div>
			) : (
				<div
					className={cn(
						"relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
						"hover:border-primary hover:bg-primary/5 cursor-pointer",
					)}
					onDrop={handleDrop}
					onDragOver={(e) => e.preventDefault()}
				>
					<input
						type="file"
						accept={accept}
						onChange={handleFileInput}
						className="absolute inset-0 cursor-pointer opacity-0"
					/>
					<Upload className="mx-auto h-8 w-8 text-muted-foreground" />
					<p className="mt-2 text-sm text-muted-foreground">
						Drop file here or <span className="text-primary font-medium">browse</span>
					</p>
					<p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG (Max 10MB)</p>
				</div>
			)}
		</div>
	);
}

export function DocumentsStep() {
	const { documents, setDocuments, nextStep, prevStep } = usePartnerRegistration();

	const updateDocument = (key: keyof typeof documents, file: File | null) => {
		setDocuments({
			...documents,
			[key]: file,
		});
	};

	const isComplete = documents.businessRegistration && documents.businessInsurance && documents.motorTradeInsurance;

	const handleContinue = () => {
		if (isComplete) {
			nextStep();
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold">Required Documents</h2>
				<p className="text-muted-foreground">Upload the necessary documents to verify your business</p>
			</div>

			<div className="grid gap-6 md:grid-cols-1">
				<FileUploadBox
					label="Business Registration Paper"
					description="Official document showing your business registration"
					file={documents.businessRegistration}
					onFileChange={(file) => updateDocument("businessRegistration", file)}
				/>

				<FileUploadBox
					label="Business Insurance Paper"
					description="Your business liability insurance certificate"
					file={documents.businessInsurance}
					onFileChange={(file) => updateDocument("businessInsurance", file)}
				/>

				<FileUploadBox
					label="Motor Trade Insurance Certificate"
					description="Insurance covering vehicles in your care"
					file={documents.motorTradeInsurance}
					onFileChange={(file) => updateDocument("motorTradeInsurance", file)}
				/>
			</div>

			<div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4">
				<p className="text-sm text-amber-800 dark:text-amber-200">
					<strong>Note:</strong> All documents will be verified by our team. Please ensure they are valid and clearly
					readable.
				</p>
			</div>

			<div className="flex justify-between pt-4">
				<Button type="button" variant="outline" onClick={prevStep}>
					Back
				</Button>
				<Button type="button" onClick={handleContinue} disabled={!isComplete}>
					Continue to Drivers
				</Button>
			</div>
		</div>
	);
}
