import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthActions } from "@/store/authStore";

import type { AccountSettings, NotificationSettings, SettingsData } from "../types";
import { defaultSettings } from "../types";

export function useSettings() {
	const navigate = useNavigate();
	const { clearAuth } = useAuthActions();
	const [settings, setSettings] = useState<SettingsData>(defaultSettings);

	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

	const handleNotificationToggle = (key: keyof NotificationSettings) => {
		setSettings((prev) => ({
			...prev,
			notifications: {
				...prev.notifications,
				[key]: !prev.notifications[key],
			},
		}));
	};

	const handleAccountUpdate = (field: keyof AccountSettings, value: string) => {
		setSettings((prev) => ({
			...prev,
			account: {
				...prev.account,
				[field]: value,
			},
		}));
	};

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
		handleChangePassword,
		handleLogout,
	};
}
