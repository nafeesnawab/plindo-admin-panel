import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
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
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
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
						<div className="relative">
							<Input
								type={showCurrent ? "text" : "password"}
								value={form.currentPassword}
								onChange={(e) => onFormChange({ ...form, currentPassword: e.target.value })}
								placeholder="Enter current password"
								className="pr-10"
							/>
							<button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrent(!showCurrent)}>
								{showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
					</div>
					<div className="space-y-2">
						<Label>New Password</Label>
						<div className="relative">
							<Input
								type={showNew ? "text" : "password"}
								value={form.newPassword}
								onChange={(e) => onFormChange({ ...form, newPassword: e.target.value })}
								placeholder="Enter new password"
								className="pr-10"
							/>
							<button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNew(!showNew)}>
								{showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Confirm New Password</Label>
						<div className="relative">
							<Input
								type={showConfirm ? "text" : "password"}
								value={form.confirmPassword}
								onChange={(e) => onFormChange({ ...form, confirmPassword: e.target.value })}
								placeholder="Confirm new password"
								className="pr-10"
							/>
							<button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(!showConfirm)}>
								{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
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
