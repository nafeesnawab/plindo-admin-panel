import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import notificationService, { type SendNotificationPayload } from "@/api/services/notificationService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { Separator } from "@/ui/separator";
import { Textarea } from "@/ui/textarea";
import {
	Bell,
	Mail,
	Calendar,
	Send,
	Eye,
	Users,
	User,
	Building2,
	Smartphone,
} from "lucide-react";
import { toast } from "sonner";

export default function SendNotificationPage() {
	const queryClient = useQueryClient();
	const [showPreview, setShowPreview] = useState(false);
	const [form, setForm] = useState<SendNotificationPayload>({
		title: "",
		body: "",
		recipientType: "all_users",
		notificationType: "push",
		scheduledAt: undefined,
	});
	const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
	const [scheduleDate, setScheduleDate] = useState("");
	const [scheduleTime, setScheduleTime] = useState("");

	const sendMutation = useMutation({
		mutationFn: (payload: SendNotificationPayload) => notificationService.sendNotification(payload),
		onSuccess: () => {
			toast.success(scheduleType === "now" ? "Notification sent!" : "Notification scheduled!");
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			setForm({
				title: "",
				body: "",
				recipientType: "all_users",
				notificationType: "push",
				scheduledAt: undefined,
			});
			setScheduleType("now");
			setScheduleDate("");
			setScheduleTime("");
		},
		onError: () => {
			toast.error("Failed to send notification");
		},
	});

	const handleSend = () => {
		if (!form.title.trim() || !form.body.trim()) {
			toast.error("Title and message body are required");
			return;
		}

		if (form.notificationType === "push" && form.body.length > 500) {
			toast.error("Push notification body must be 500 characters or less");
			return;
		}

		const payload = { ...form };
		if (scheduleType === "later" && scheduleDate && scheduleTime) {
			payload.scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
		}

		sendMutation.mutate(payload);
	};

	const getRecipientIcon = () => {
		switch (form.recipientType) {
			case "all_users": return <Users className="h-4 w-4" />;
			case "all_customers": return <User className="h-4 w-4" />;
			case "all_partners": return <Building2 className="h-4 w-4" />;
			case "specific_user": return <User className="h-4 w-4" />;
		}
	};

	const getRecipientLabel = () => {
		switch (form.recipientType) {
			case "all_users": return "All Users";
			case "all_customers": return "All Customers";
			case "all_partners": return "All Partners";
			case "specific_user": return "Specific User";
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bell className="h-5 w-5" />
							Send Notification
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label>Recipient Type</Label>
							<Select
								value={form.recipientType}
								onValueChange={(v) => setForm({ ...form, recipientType: v as SendNotificationPayload["recipientType"] })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all_users">
										<div className="flex items-center gap-2">
											<Users className="h-4 w-4" />
											All Users
										</div>
									</SelectItem>
									<SelectItem value="all_customers">
										<div className="flex items-center gap-2">
											<User className="h-4 w-4" />
											All Customers
										</div>
									</SelectItem>
									<SelectItem value="all_partners">
										<div className="flex items-center gap-2">
											<Building2 className="h-4 w-4" />
											All Partners
										</div>
									</SelectItem>
									<SelectItem value="specific_user">
										<div className="flex items-center gap-2">
											<User className="h-4 w-4" />
											Specific User
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{form.recipientType === "specific_user" && (
							<div className="space-y-2">
								<Label>User Email or ID</Label>
								<Input
									placeholder="Enter user email or ID..."
									value={form.recipientId || ""}
									onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
								/>
							</div>
						)}

						<div className="space-y-2">
							<Label>Notification Type</Label>
							<Select
								value={form.notificationType}
								onValueChange={(v) => setForm({ ...form, notificationType: v as SendNotificationPayload["notificationType"] })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="push">
										<div className="flex items-center gap-2">
											<Smartphone className="h-4 w-4" />
											Push Notification
										</div>
									</SelectItem>
									<SelectItem value="email">
										<div className="flex items-center gap-2">
											<Mail className="h-4 w-4" />
											Email
										</div>
									</SelectItem>
									<SelectItem value="both">
										<div className="flex items-center gap-2">
											<Bell className="h-4 w-4" />
											Both (Push + Email)
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Separator />

						<div className="space-y-2">
							<Label>Message Title *</Label>
							<Input
								placeholder="Enter notification title..."
								value={form.title}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
								maxLength={100}
							/>
							<p className="text-xs text-muted-foreground">{form.title.length}/100 characters</p>
						</div>

						<div className="space-y-2">
							<Label>Message Body *</Label>
							<Textarea
								placeholder="Enter notification message..."
								value={form.body}
								onChange={(e) => setForm({ ...form, body: e.target.value })}
								rows={5}
								maxLength={form.notificationType === "push" ? 500 : 2000}
							/>
							<p className="text-xs text-muted-foreground">
								{form.body.length}/{form.notificationType === "push" ? 500 : 2000} characters
								{form.notificationType === "push" && " (push notification limit)"}
							</p>
						</div>

						<Separator />

						<div className="space-y-2">
							<Label>Schedule</Label>
							<div className="flex gap-2">
								<Button
									type="button"
									variant={scheduleType === "now" ? "default" : "outline"}
									onClick={() => setScheduleType("now")}
									className="flex-1"
								>
									<Send className="h-4 w-4 mr-2" />
									Send Now
								</Button>
								<Button
									type="button"
									variant={scheduleType === "later" ? "default" : "outline"}
									onClick={() => setScheduleType("later")}
									className="flex-1"
								>
									<Calendar className="h-4 w-4 mr-2" />
									Schedule Later
								</Button>
							</div>
						</div>

						{scheduleType === "later" && (
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Date</Label>
									<Input
										type="date"
										value={scheduleDate}
										onChange={(e) => setScheduleDate(e.target.value)}
										min={new Date().toISOString().split("T")[0]}
									/>
								</div>
								<div className="space-y-2">
									<Label>Time</Label>
									<Input
										type="time"
										value={scheduleTime}
										onChange={(e) => setScheduleTime(e.target.value)}
									/>
								</div>
							</div>
						)}

						<div className="flex gap-2 pt-4">
							<Button
								variant="outline"
								onClick={() => setShowPreview(!showPreview)}
								className="flex-1"
							>
								<Eye className="h-4 w-4 mr-2" />
								{showPreview ? "Hide" : "Show"} Preview
							</Button>
							<Button
								onClick={handleSend}
								disabled={sendMutation.isPending || !form.title || !form.body}
								className="flex-1"
							>
								<Send className="h-4 w-4 mr-2" />
								{scheduleType === "now" ? "Send Now" : "Schedule"}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="space-y-6">
				{showPreview && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Eye className="h-5 w-5" />
								Preview
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-2">
								<Badge variant="outline" className="gap-1">
									{getRecipientIcon()}
									{getRecipientLabel()}
								</Badge>
								<Badge variant="secondary">
									{form.notificationType === "push" && "Push"}
									{form.notificationType === "email" && "Email"}
									{form.notificationType === "both" && "Push + Email"}
								</Badge>
							</div>

							{form.notificationType !== "email" && (
								<div className="border rounded-lg p-4 bg-muted/50">
									<p className="text-xs text-muted-foreground mb-2">Push Notification Preview</p>
									<div className="bg-background rounded-lg p-3 shadow-sm border">
										<div className="flex items-start gap-3">
											<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
												<Bell className="h-5 w-5 text-primary" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-medium text-sm truncate">
													{form.title || "Notification Title"}
												</p>
												<p className="text-xs text-muted-foreground line-clamp-2">
													{form.body || "Notification message will appear here..."}
												</p>
											</div>
										</div>
									</div>
								</div>
							)}

							{form.notificationType !== "push" && (
								<div className="border rounded-lg p-4 bg-muted/50">
									<p className="text-xs text-muted-foreground mb-2">Email Preview</p>
									<div className="bg-background rounded-lg p-4 shadow-sm border">
										<div className="border-b pb-3 mb-3">
											<p className="text-xs text-muted-foreground">From: PLINDO &lt;noreply@plindo.com&gt;</p>
											<p className="text-xs text-muted-foreground">Subject: {form.title || "Email Subject"}</p>
										</div>
										<div className="space-y-2">
											<p className="font-medium">{form.title || "Email Title"}</p>
											<p className="text-sm text-muted-foreground whitespace-pre-wrap">
												{form.body || "Email body will appear here..."}
											</p>
										</div>
									</div>
								</div>
							)}

							{scheduleType === "later" && scheduleDate && scheduleTime && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Calendar className="h-4 w-4" />
									Scheduled for: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
								</div>
							)}
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Quick Tips</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-muted-foreground">
						<p>• <strong>Push notifications</strong> are limited to 500 characters for optimal display.</p>
						<p>• <strong>All Users</strong> includes both customers and partners.</p>
						<p>• <strong>Scheduled notifications</strong> will be sent at the specified time in your local timezone.</p>
						<p>• Use <strong>Both</strong> option for important announcements to ensure maximum reach.</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
