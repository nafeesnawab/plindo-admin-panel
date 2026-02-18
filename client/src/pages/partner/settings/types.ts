export interface NotificationSettings {
	newBooking: boolean;
	newReview: boolean;
	customerMessage: boolean;
}

export interface AccountSettings {
	email: string;
	phone: string;
}

export interface SettingsData {
	account: AccountSettings;
	notifications: NotificationSettings;
}

export const defaultSettings: SettingsData = {
	account: {
		email: "partner@example.com",
		phone: "+353 86 123 4567",
	},
	notifications: {
		newBooking: true,
		newReview: true,
		customerMessage: true,
	},
};
