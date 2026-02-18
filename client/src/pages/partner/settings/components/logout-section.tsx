import { LogOut } from "lucide-react";

import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";

interface LogoutSectionProps {
	dialogOpen: boolean;
	onDialogOpenChange: (open: boolean) => void;
	onLogout: () => void;
}

export function LogoutSection({ dialogOpen, onDialogOpenChange, onLogout }: LogoutSectionProps) {
	return (
		<>
			<Card className="border-destructive/20">
				<CardContent className="flex items-center justify-between py-6">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
							<LogOut className="h-5 w-5 text-destructive" />
						</div>
						<div>
							<p className="font-medium">Sign Out</p>
							<p className="text-sm text-muted-foreground">Log out of your partner account</p>
						</div>
					</div>
					<Button variant="destructive" onClick={() => onDialogOpenChange(true)}>
						<LogOut className="mr-2 h-4 w-4" />
						Logout
					</Button>
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Logout</DialogTitle>
						<DialogDescription>Are you sure you want to log out of your partner account?</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => onDialogOpenChange(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={onLogout}>
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
