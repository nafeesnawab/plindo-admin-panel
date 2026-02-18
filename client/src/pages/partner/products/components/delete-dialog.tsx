import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";

interface DeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	productName: string;
	onConfirm: () => void;
	isPending?: boolean;
}

export function DeleteDialog({ open, onOpenChange, productName, onConfirm, isPending }: DeleteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Product</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete &quot;{productName}&quot;? This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={onConfirm} disabled={isPending}>
						Delete Product
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
