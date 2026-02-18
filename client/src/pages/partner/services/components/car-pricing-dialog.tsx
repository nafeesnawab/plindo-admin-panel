import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

import type { AdminCar } from "../types";

interface CarOverrideDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedMake: string;
	onMakeChange: (value: string) => void;
	selectedModel: string;
	onModelChange: (value: string) => void;
	overridePrice: number;
	onPriceChange: (value: number) => void;
	uniqueMakes: string[];
	modelsForMake: AdminCar[];
	getBodyTypeDefaultPrice: (bodyType: string) => number;
	onAdd: () => boolean;
}

export function CarOverrideDialog({
	open,
	onOpenChange,
	selectedMake,
	onMakeChange,
	selectedModel,
	onModelChange,
	overridePrice,
	onPriceChange,
	uniqueMakes,
	modelsForMake,
	getBodyTypeDefaultPrice,
	onAdd,
}: CarOverrideDialogProps) {
	const handleAdd = () => {
		const success = onAdd();
		if (success) onOpenChange(false);
	};

	const selectedCar = modelsForMake.find((c) => c.model === selectedModel);
	const defaultPrice = selectedCar ? getBodyTypeDefaultPrice(selectedCar.bodyType) : 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Add Custom Car Price</DialogTitle>
					<DialogDescription>Override the body type default price for a specific car</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Make / Company *</Label>
						<Select
							value={selectedMake}
							onValueChange={(value) => {
								onMakeChange(value);
								onModelChange("");
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select make" />
							</SelectTrigger>
							<SelectContent>
								{uniqueMakes.map((make) => (
									<SelectItem key={make} value={make}>
										{make}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Model *</Label>
						<Select value={selectedModel} onValueChange={onModelChange} disabled={!selectedMake}>
							<SelectTrigger>
								<SelectValue placeholder="Select model" />
							</SelectTrigger>
							<SelectContent>
								{modelsForMake.map((car) => (
									<SelectItem key={car.id} value={car.model}>
										{car.model} ({car.bodyType})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{selectedCar && (
						<div className="rounded-lg bg-muted/50 p-3 text-sm">
							<span className="text-muted-foreground">Body type:</span>{" "}
							<span className="font-medium">{selectedCar.bodyType}</span>
							<span className="text-muted-foreground ml-3">Default price:</span>{" "}
							<span className="font-medium">\u00A3{defaultPrice}</span>
						</div>
					)}
					<div className="space-y-2">
						<Label>Custom Price (\u00A3) *</Label>
						<Input
							type="number"
							min={0}
							step={0.5}
							value={overridePrice}
							onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleAdd}>Add Override</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
