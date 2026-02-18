import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";

interface DeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	serviceName: string;
	onConfirm: () => void;
}

export function DeleteDialog({ open, onOpenChange, serviceName, onConfirm }: DeleteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Service</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete &quot;{serviceName}&quot;? This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
					<Button variant="destructive" onClick={onConfirm}>Delete Service</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
