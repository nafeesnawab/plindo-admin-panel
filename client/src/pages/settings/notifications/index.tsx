import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Bell,
	Calendar,
	CreditCard,
	Edit,
	Megaphone,
	Save,
	Settings,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import settingsService, {
	type NotificationTemplate,
	type NotificationTypes,
} from "@/api/services/settingsService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Skeleton } from "@/ui/skeleton";
import { Switch } from "@/ui/switch";
import { Textarea } from "@/ui/textarea";

const notificationTypeLabels: Record<
	string,
	{ label: string; icon: React.ReactNode; description: string }
> = {
	bookingConfirmation: {
		label: "Booking Confirmation",
		icon: <Calendar className="h-4 w-4" />,
		description: "Sent when a booking is confirmed",
	},
	bookingReminder: {
		label: "Booking Reminder",
		icon: <Bell className="h-4 w-4" />,
		description: "Sent 24 hours before appointment",
	},
	bookingCancellation: {
		label: "Booking Cancellation",
		icon: <XCircle className="h-4 w-4" />,
		description: "Sent when a booking is cancelled",
	},
	paymentSuccess: {
		label: "Payment Success",
		icon: <CreditCard className="h-4 w-4" />,
		description: "Sent when payment is successful",
	},
	paymentFailed: {
		label: "Payment Failed",
		icon: <CreditCard className="h-4 w-4" />,
		description: "Sent when payment fails",
	},
	promotions: {
		label: "Promotions",
		icon: <Megaphone className="h-4 w-4" />,
		description: "Marketing messages",
	},
	systemUpdates: {
		label: "System Updates",
		icon: <Settings className="h-4 w-4" />,
		description: "Platform announcements",
	},
};

export default function NotificationSettingsPage() {
	const queryClient = useQueryClient();
	const [types, setTypes] = useState<NotificationTypes>({
		bookingConfirmation: true,
		bookingReminder: true,
		bookingCancellation: true,
		paymentSuccess: true,
		paymentFailed: true,
		promotions: true,
		systemUpdates: true,
	});
	const [editingTemplate, setEditingTemplate] =
		useState<NotificationTemplate | null>(null);
	const [templateSubject, setTemplateSubject] = useState("");
	const [templateBody, setTemplateBody] = useState("");

	const { data: settingsData, isLoading: settingsLoading } = useQuery({
		queryKey: ["settings-notifications"],
		queryFn: () => settingsService.getNotificationSettings(),
	});

	const { data: templatesData, isLoading: templatesLoading } = useQuery({
		queryKey: ["settings-notification-templates"],
		queryFn: () => settingsService.getNotificationTemplates(),
	});

	useEffect(() => {
		if (settingsData) {
			setTypes(settingsData.types);
		}
	}, [settingsData]);

	const updateSettingsMutation = useMutation({
		mutationFn: () =>
			settingsService.updateNotificationSettings({ types: types }),
		onSuccess: () => {
			toast.success("Notification settings updated");
			queryClient.invalidateQueries({ queryKey: ["settings-notifications"] });
		},
		onError: () => {
			toast.error("Failed to update settings");
		},
	});

	const updateTemplateMutation = useMutation({
		mutationFn: () =>
			settingsService.updateNotificationTemplate(editingTemplate!.id, {
				subject: templateSubject,
				body: templateBody,
			}),
		onSuccess: () => {
			toast.success("Template updated");
			queryClient.invalidateQueries({
				queryKey: ["settings-notification-templates"],
			});
			setEditingTemplate(null);
		},
		onError: () => {
			toast.error("Failed to update template");
		},
	});

	const hasChanges =
		settingsData &&
		JSON.stringify(types) !== JSON.stringify(settingsData.types);

	const openTemplateEditor = (template: NotificationTemplate) => {
		setEditingTemplate(template);
		setTemplateSubject(template.subject);
		setTemplateBody(template.body);
	};

	if (settingsLoading || templatesLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-[300px]" />
				<Skeleton className="h-[300px]" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Notification Settings</h1>
					<p className="text-muted-foreground">
						Configure notification types and templates
					</p>
				</div>
				<Button
					onClick={() => updateSettingsMutation.mutate()}
					disabled={!hasChanges || updateSettingsMutation.isPending}
				>
					<Save className="h-4 w-4 mr-2" />
					Save Changes
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bell className="h-5 w-5 text-blue-600" />
						Notification Types
					</CardTitle>
					<CardDescription>
						Enable or disable specific notification types
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{Object.entries(notificationTypeLabels).map(
							([key, { label, icon, description }]) => (
								<div
									key={key}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-muted">{icon}</div>
										<div>
											<p className="font-medium">{label}</p>
											<p className="text-xs text-muted-foreground">
												{description}
											</p>
										</div>
									</div>
									<Switch
										checked={types[key as keyof NotificationTypes] ?? true}
										onCheckedChange={(checked) =>
											setTypes({
												...types,
												[key as keyof NotificationTypes]: checked,
											})
										}
									/>
								</div>
							),
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Edit className="h-5 w-5 text-green-600" />
						Notification Templates
					</CardTitle>
					<CardDescription>
						Customize notification message templates
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{templatesData?.map((template) => (
							<div
								key={template.id}
								className="flex items-center justify-between p-4 border rounded-lg"
							>
								<div className="flex-1 min-w-0">
									<p className="font-medium">{template.name}</p>
									<p className="text-sm text-muted-foreground truncate">
										{template.subject}
									</p>
									<div className="flex gap-1 mt-2 flex-wrap">
										{template.variables.map((v) => (
											<Badge key={v} variant="secondary" className="text-xs">
												{`{{${v}}}`}
											</Badge>
										))}
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => openTemplateEditor(template)}
								>
									<Edit className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{settingsData?.updatedAt && (
				<p className="text-sm text-muted-foreground">
					Last updated: {format(new Date(settingsData.updatedAt), "PPpp")}
				</p>
			)}

			<Dialog
				open={!!editingTemplate}
				onOpenChange={() => setEditingTemplate(null)}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Edit Template: {editingTemplate?.name}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Subject</Label>
							<Input
								value={templateSubject}
								onChange={(e) => setTemplateSubject(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Body</Label>
							<Textarea
								rows={5}
								value={templateBody}
								onChange={(e) => setTemplateBody(e.target.value)}
							/>
						</div>
						<div>
							<p className="text-sm text-muted-foreground mb-2">
								Available variables:
							</p>
							<div className="flex gap-1 flex-wrap">
								{editingTemplate?.variables.map((v) => (
									<Badge
										key={v}
										variant="outline"
										className="text-xs cursor-pointer"
										onClick={() => setTemplateBody(templateBody + `{{${v}}}`)}
									>{`{{${v}}}`}</Badge>
								))}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingTemplate(null)}>
							Cancel
						</Button>
						<Button
							onClick={() => updateTemplateMutation.mutate()}
							disabled={updateTemplateMutation.isPending}
						>
							Save Template
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
