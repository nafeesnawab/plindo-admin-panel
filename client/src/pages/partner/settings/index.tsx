import { AccountCard } from "./components/account-card";
import { LogoutSection } from "./components/logout-section";
import { NotificationsCard } from "./components/notifications-card";
import { PasswordDialog } from "./components/password-dialog";
import { useSettings } from "./hooks/use-settings";

export default function PartnerSettings() {
	const {
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
	} = useSettings();

	return (
		<div className="flex flex-col gap-4 h-full">
			<div className="grid gap-4 lg:grid-cols-2">
				<AccountCard
					account={settings.account}
					onUpdate={handleAccountUpdate}
					onChangePassword={() => setPasswordDialogOpen(true)}
				/>
				<NotificationsCard
					notifications={settings.notifications}
					onToggle={handleNotificationToggle}
				/>
			</div>

			<LogoutSection
				dialogOpen={logoutDialogOpen}
				onDialogOpenChange={setLogoutDialogOpen}
				onLogout={handleLogout}
			/>

			<PasswordDialog
				open={passwordDialogOpen}
				onOpenChange={setPasswordDialogOpen}
				form={passwordForm}
				onFormChange={setPasswordForm}
				onSubmit={handleChangePassword}
			/>
		</div>
	);
}
