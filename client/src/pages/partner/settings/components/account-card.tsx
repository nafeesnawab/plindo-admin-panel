import { Key, Mail, Phone } from "lucide-react";

import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

import type { AccountSettings } from "../types";

interface AccountCardProps {
	account: AccountSettings;
	onUpdate: (field: keyof AccountSettings, value: string) => void;
	onChangePassword: () => void;
}

export function AccountCard({ account, onUpdate, onChangePassword }: AccountCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Key className="h-5 w-5" />
					Account Settings
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label className="flex items-center gap-2">
						<Mail className="h-4 w-4 text-muted-foreground" />
						Email Address
					</Label>
					<Input
						type="email"
						value={account.email}
						onChange={(e) => onUpdate("email", e.target.value)}
						placeholder="your@email.com"
					/>
				</div>
				<div className="space-y-2">
					<Label className="flex items-center gap-2">
						<Phone className="h-4 w-4 text-muted-foreground" />
						Phone Number
					</Label>
					<Input
						value={account.phone}
						onChange={(e) => onUpdate("phone", e.target.value)}
						placeholder="+353 86 123 4567"
					/>
				</div>
				<Button variant="outline" className="w-full" onClick={onChangePassword}>
					<Key className="mr-2 h-4 w-4" />
					Change Password
				</Button>
			</CardContent>
		</Card>
	);
}
