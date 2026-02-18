import { Bell } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";

import type { NotificationSettings } from "../types";

interface NotificationsCardProps {
	notifications: NotificationSettings;
	onToggle: (key: keyof NotificationSettings) => void;
}

const NOTIFICATION_ITEMS: { key: keyof NotificationSettings; label: string; description: string }[] = [
	{ key: "newBooking", label: "New Booking Alerts", description: "Get notified when you receive a new booking" },
	{ key: "newReview", label: "New Reviews", description: "Get notified when customers leave reviews" },
	{ key: "customerMessage", label: "Customer Messages", description: "Get notified when customers send messages" },
];

export function NotificationsCard({ notifications, onToggle }: NotificationsCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Bell className="h-5 w-5" />
					Notifications
				</CardTitle>
				<CardDescription>Choose which notifications you want to receive</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{NOTIFICATION_ITEMS.map((item) => (
					<div key={item.key} className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{item.label}</Label>
							<p className="text-xs text-muted-foreground">{item.description}</p>
						</div>
						<Switch checked={notifications[item.key]} onCheckedChange={() => onToggle(item.key)} />
					</div>
				))}
			</CardContent>
		</Card>
	);
}
