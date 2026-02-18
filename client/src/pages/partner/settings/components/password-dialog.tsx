import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

interface PasswordForm {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

interface PasswordDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: PasswordForm;
	onFormChange: (form: PasswordForm) => void;
	onSubmit: () => void;
}

export function PasswordDialog({ open, onOpenChange, form, onFormChange, onSubmit }: PasswordDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change Password</DialogTitle>
					<DialogDescription>Enter your current password and choose a new one</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Current Password</Label>
						<Input
							type="password"
							value={form.currentPassword}
							onChange={(e) => onFormChange({ ...form, currentPassword: e.target.value })}
							placeholder="Enter current password"
						/>
					</div>
					<div className="space-y-2">
						<Label>New Password</Label>
						<Input
							type="password"
							value={form.newPassword}
							onChange={(e) => onFormChange({ ...form, newPassword: e.target.value })}
							placeholder="Enter new password"
						/>
					</div>
					<div className="space-y-2">
						<Label>Confirm New Password</Label>
						<Input
							type="password"
							value={form.confirmPassword}
							onChange={(e) => onFormChange({ ...form, confirmPassword: e.target.value })}
							placeholder="Confirm new password"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={onSubmit}>Change Password</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
