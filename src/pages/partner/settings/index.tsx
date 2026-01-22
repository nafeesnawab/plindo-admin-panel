import {
	Bell,
	Building2,
	CreditCard,
	ExternalLink,
	FileText,
	HelpCircle,
	Key,
	LogOut,
	Mail,
	MessageSquare,
	Phone,
	Save,
	Shield,
	Smartphone,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";

// Types
interface NotificationSettings {
	newBooking: boolean;
	paymentConfirmation: boolean;
	newReview: boolean;
	customerMessage: boolean;
	documentExpiry: boolean;
	promotional: boolean;
}

interface NotificationMethods {
	push: boolean;
	email: boolean;
	sms: boolean;
}

interface BankDetails {
	bankName: string;
	accountName: string;
	iban: string;
	bic: string;
}

interface AccountSettings {
	email: string;
	phone: string;
}

interface SettingsData {
	account: AccountSettings;
	notifications: NotificationSettings;
	notificationMethods: NotificationMethods;
	bankDetails: BankDetails;
	commissionRate: number;
}

// Mock data
const mockSettings: SettingsData = {
	account: {
		email: "partner@example.com",
		phone: "+353 86 123 4567",
	},
	notifications: {
		newBooking: true,
		paymentConfirmation: true,
		newReview: true,
		customerMessage: true,
		documentExpiry: true,
		promotional: false,
	},
	notificationMethods: {
		push: true,
		email: true,
		sms: false,
	},
	bankDetails: {
		bankName: "Bank of Ireland",
		accountName: "Premium Auto Detailing Ltd",
		iban: "IE29 AIBK 9311 5212 3456 78",
		bic: "BOFIIE2D",
	},
	commissionRate: 10,
};

export default function PartnerSettings() {
	const navigate = useNavigate();
	const [settings, setSettings] = useState<SettingsData>(mockSettings);
	const [isSaving, setIsSaving] = useState(false);

	// Password dialog
	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	// Bank details dialog
	const [bankDialogOpen, setBankDialogOpen] = useState(false);
	const [bankForm, setBankForm] = useState<BankDetails>(mockSettings.bankDetails);

	// Logout dialog
	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

	// Handle notification toggle
	const handleNotificationToggle = (key: keyof NotificationSettings) => {
		setSettings((prev) => ({
			...prev,
			notifications: {
				...prev.notifications,
				[key]: !prev.notifications[key],
			},
		}));
	};

	// Handle notification method toggle
	const handleMethodToggle = (key: keyof NotificationMethods) => {
		setSettings((prev) => ({
			...prev,
			notificationMethods: {
				...prev.notificationMethods,
				[key]: !prev.notificationMethods[key],
			},
		}));
	};

	// Handle save settings
	const handleSaveSettings = async () => {
		setIsSaving(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		setIsSaving(false);
		toast.success("Settings saved successfully");
	};

	// Handle change password
	const handleChangePassword = async () => {
		if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
			toast.error("Please fill in all fields");
			return;
		}
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}
		if (passwordForm.newPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
		setPasswordDialogOpen(false);
		setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
		toast.success("Password changed successfully");
	};

	// Handle update bank details
	const handleUpdateBankDetails = async () => {
		if (!bankForm.bankName || !bankForm.accountName || !bankForm.iban) {
			toast.error("Please fill in required fields");
			return;
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
		setSettings((prev) => ({
			...prev,
			bankDetails: bankForm,
		}));
		setBankDialogOpen(false);
		toast.success("Bank details updated successfully");
	};

	// Handle logout
	const handleLogout = () => {
		localStorage.removeItem("partner_token");
		localStorage.removeItem("partner_user");
		navigate("/partner/login");
		toast.success("Logged out successfully");
	};

	// Handle account update
	const handleAccountUpdate = (field: keyof AccountSettings, value: string) => {
		setSettings((prev) => ({
			...prev,
			account: {
				...prev.account,
				[field]: value,
			},
		}));
	};

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Settings</h1>
					<p className="text-muted-foreground">Manage your account and preferences</p>
				</div>
				<Button onClick={handleSaveSettings} disabled={isSaving}>
					<Save className="mr-2 h-4 w-4" />
					{isSaving ? "Saving..." : "Save Changes"}
				</Button>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Account Settings */}
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
								value={settings.account.email}
								onChange={(e) => handleAccountUpdate("email", e.target.value)}
								placeholder="your@email.com"
							/>
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Phone className="h-4 w-4 text-muted-foreground" />
								Phone Number
							</Label>
							<Input
								value={settings.account.phone}
								onChange={(e) => handleAccountUpdate("phone", e.target.value)}
								placeholder="+353 86 123 4567"
							/>
						</div>
						<Button variant="outline" className="w-full" onClick={() => setPasswordDialogOpen(true)}>
							<Key className="mr-2 h-4 w-4" />
							Change Password
						</Button>
					</CardContent>
				</Card>

				{/* Payment Settings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<CreditCard className="h-5 w-5" />
							Payment Settings
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-lg border p-4">
							<div className="flex items-center justify-between mb-3">
								<p className="font-medium">Bank Account</p>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setBankForm(settings.bankDetails);
										setBankDialogOpen(true);
									}}
								>
									Edit
								</Button>
							</div>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Bank</span>
									<span>{settings.bankDetails.bankName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Account Name</span>
									<span>{settings.bankDetails.accountName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">IBAN</span>
									<span className="font-mono text-xs">
										{settings.bankDetails.iban.replace(/(.{4})/g, "$1 ").trim()}
									</span>
								</div>
								{settings.bankDetails.bic && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">BIC</span>
										<span className="font-mono">{settings.bankDetails.bic}</span>
									</div>
								)}
							</div>
						</div>
						<div className="rounded-lg bg-muted p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium">Commission Rate</p>
									<p className="text-sm text-muted-foreground">Platform fee on each booking</p>
								</div>
								<Badge variant="secondary" className="text-lg font-bold">
									{settings.commissionRate}%
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Notification Types */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Bell className="h-5 w-5" />
							Notification Types
						</CardTitle>
						<CardDescription>Choose which notifications you want to receive</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>New Booking Alerts</Label>
								<p className="text-xs text-muted-foreground">Get notified when you receive a new booking</p>
							</div>
							<Switch
								checked={settings.notifications.newBooking}
								onCheckedChange={() => handleNotificationToggle("newBooking")}
							/>
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Payment Confirmations</Label>
								<p className="text-xs text-muted-foreground">Get notified when payments are received</p>
							</div>
							<Switch
								checked={settings.notifications.paymentConfirmation}
								onCheckedChange={() => handleNotificationToggle("paymentConfirmation")}
							/>
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>New Reviews</Label>
								<p className="text-xs text-muted-foreground">Get notified when customers leave reviews</p>
							</div>
							<Switch
								checked={settings.notifications.newReview}
								onCheckedChange={() => handleNotificationToggle("newReview")}
							/>
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Customer Messages</Label>
								<p className="text-xs text-muted-foreground">Get notified when customers send messages</p>
							</div>
							<Switch
								checked={settings.notifications.customerMessage}
								onCheckedChange={() => handleNotificationToggle("customerMessage")}
							/>
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Document Expiry Reminders</Label>
								<p className="text-xs text-muted-foreground">Get reminded before documents expire</p>
							</div>
							<Switch
								checked={settings.notifications.documentExpiry}
								onCheckedChange={() => handleNotificationToggle("documentExpiry")}
							/>
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Promotional Opportunities</Label>
								<p className="text-xs text-muted-foreground">Receive marketing and promotional updates</p>
							</div>
							<Switch
								checked={settings.notifications.promotional}
								onCheckedChange={() => handleNotificationToggle("promotional")}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Notification Methods */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<MessageSquare className="h-5 w-5" />
							Notification Methods
						</CardTitle>
						<CardDescription>Choose how you want to receive notifications</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between p-4 rounded-lg border">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
									<Smartphone className="h-5 w-5 text-primary" />
								</div>
								<div>
									<Label>Push Notifications</Label>
									<p className="text-xs text-muted-foreground">Receive push notifications on your device</p>
								</div>
							</div>
							<Switch checked={settings.notificationMethods.push} onCheckedChange={() => handleMethodToggle("push")} />
						</div>
						<div className="flex items-center justify-between p-4 rounded-lg border">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
									<Mail className="h-5 w-5 text-primary" />
								</div>
								<div>
									<Label>Email</Label>
									<p className="text-xs text-muted-foreground">Receive notifications via email</p>
								</div>
							</div>
							<Switch
								checked={settings.notificationMethods.email}
								onCheckedChange={() => handleMethodToggle("email")}
							/>
						</div>
						<div className="flex items-center justify-between p-4 rounded-lg border">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
									<Phone className="h-5 w-5 text-primary" />
								</div>
								<div>
									<Label>SMS</Label>
									<p className="text-xs text-muted-foreground">Receive notifications via SMS</p>
								</div>
							</div>
							<Switch checked={settings.notificationMethods.sms} onCheckedChange={() => handleMethodToggle("sms")} />
						</div>
					</CardContent>
				</Card>

				{/* Legal & Support */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Shield className="h-5 w-5" />
							Legal & Support
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<Button
								variant="outline"
								className="h-auto flex-col items-start gap-2 p-4"
								onClick={() => window.open("/terms", "_blank")}
							>
								<FileText className="h-5 w-5 text-muted-foreground" />
								<div className="text-left">
									<p className="font-medium">Terms & Conditions</p>
									<p className="text-xs text-muted-foreground">Read our terms of service</p>
								</div>
								<ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
							</Button>
							<Button
								variant="outline"
								className="h-auto flex-col items-start gap-2 p-4"
								onClick={() => window.open("/privacy", "_blank")}
							>
								<Shield className="h-5 w-5 text-muted-foreground" />
								<div className="text-left">
									<p className="font-medium">Privacy Policy</p>
									<p className="text-xs text-muted-foreground">How we handle your data</p>
								</div>
								<ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
							</Button>
							<Button
								variant="outline"
								className="h-auto flex-col items-start gap-2 p-4"
								onClick={() => toast.info("Opening support chat...")}
							>
								<MessageSquare className="h-5 w-5 text-muted-foreground" />
								<div className="text-left">
									<p className="font-medium">Contact Support</p>
									<p className="text-xs text-muted-foreground">Get help from our team</p>
								</div>
							</Button>
							<Button
								variant="outline"
								className="h-auto flex-col items-start gap-2 p-4"
								onClick={() => window.open("/faqs", "_blank")}
							>
								<HelpCircle className="h-5 w-5 text-muted-foreground" />
								<div className="text-left">
									<p className="font-medium">FAQs</p>
									<p className="text-xs text-muted-foreground">Frequently asked questions</p>
								</div>
								<ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Logout */}
				<Card className="lg:col-span-2 border-destructive/20">
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
						<Button variant="destructive" onClick={() => setLogoutDialogOpen(true)}>
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Change Password Dialog */}
			<Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
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
								value={passwordForm.currentPassword}
								onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
								placeholder="Enter current password"
							/>
						</div>
						<div className="space-y-2">
							<Label>New Password</Label>
							<Input
								type="password"
								value={passwordForm.newPassword}
								onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
								placeholder="Enter new password"
							/>
						</div>
						<div className="space-y-2">
							<Label>Confirm New Password</Label>
							<Input
								type="password"
								value={passwordForm.confirmPassword}
								onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
								placeholder="Confirm new password"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleChangePassword}>Change Password</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Bank Details Dialog */}
			<Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Update Bank Details</DialogTitle>
						<DialogDescription>Enter your bank account details for payouts</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Bank Name</Label>
							<Input
								value={bankForm.bankName}
								onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
								placeholder="e.g., Bank of Ireland"
							/>
						</div>
						<div className="space-y-2">
							<Label>Account Name</Label>
							<Input
								value={bankForm.accountName}
								onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
								placeholder="Account holder name"
							/>
						</div>
						<div className="space-y-2">
							<Label>IBAN</Label>
							<Input
								value={bankForm.iban}
								onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
								placeholder="IE29 AIBK 9311 5212 3456 78"
							/>
						</div>
						<div className="space-y-2">
							<Label>BIC (Optional)</Label>
							<Input
								value={bankForm.bic}
								onChange={(e) => setBankForm({ ...bankForm, bic: e.target.value })}
								placeholder="BOFIIE2D"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setBankDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleUpdateBankDetails}>
							<Building2 className="mr-2 h-4 w-4" />
							Update Details
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Logout Confirmation Dialog */}
			<Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Logout</DialogTitle>
						<DialogDescription>Are you sure you want to log out of your partner account?</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleLogout}>
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
