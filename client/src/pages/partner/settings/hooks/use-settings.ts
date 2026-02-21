import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import partnerSettingsService from "@/api/services/partnerSettingsService";
import { useAuthActions } from "@/store/authStore";

import type {
	AccountSettings,
	NotificationSettings,
	SettingsData,
} from "../types";
import { defaultSettings } from "../types";

export function useSettings() {
	const navigate = useNavigate();
	const { clearAuth } = useAuthActions();
	const queryClient = useQueryClient();

	const [settings, setSettings] = useState<SettingsData>(defaultSettings);
	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

	// Fetch real settings from backend
	const { data: settingsData } = useQuery({
		queryKey: ["partner-settings"],
		queryFn: () => partnerSettingsService.getSettings(),
	});

	useEffect(() => {
		if (settingsData?.settings) {
			setSettings({
				account: settingsData.settings.account,
				notifications: settingsData.settings.notifications,
			});
		}
	}, [settingsData]);

	const updateMutation = useMutation({
		mutationFn: (data: Partial<SettingsData>) =>
			partnerSettingsService.updateSettings(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["partner-settings"] });
			toast.success("Settings saved");
		},
		onError: () => toast.error("Failed to save settings"),
	});

	const handleNotificationToggle = (key: keyof NotificationSettings) => {
		const updated: SettingsData = {
			...settings,
			notifications: {
				...settings.notifications,
				[key]: !settings.notifications[key],
			},
		};
		setSettings(updated);
		updateMutation.mutate({ notifications: updated.notifications });
	};

	const handleAccountUpdate = (field: keyof AccountSettings, value: string) => {
		setSettings((prev) => ({
			...prev,
			account: { ...prev.account, [field]: value },
		}));
	};

	const handleAccountSave = () => {
		updateMutation.mutate({ account: settings.account });
	};

	const handleChangePassword = async () => {
		if (
			!passwordForm.currentPassword ||
			!passwordForm.newPassword ||
			!passwordForm.confirmPassword
		) {
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
		try {
			await partnerSettingsService.changePassword({
				currentPassword: passwordForm.currentPassword,
				newPassword: passwordForm.newPassword,
			});
			setPasswordDialogOpen(false);
			setPasswordForm({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
			toast.success("Password changed successfully");
		} catch {
			toast.error("Failed to change password. Check your current password.");
		}
	};

	const handleLogout = () => {
		clearAuth();
		toast.success("Logged out successfully");
		navigate("/auth/login", { replace: true });
	};

	return {
		settings,
		passwordDialogOpen,
		setPasswordDialogOpen,
		passwordForm,
		setPasswordForm,
		logoutDialogOpen,
		setLogoutDialogOpen,
		handleNotificationToggle,
		handleAccountUpdate,
		handleAccountSave,
		handleChangePassword,
		handleLogout,
	};
}
