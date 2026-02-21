import apiClient from "../apiClient";

export enum PartnerSettingsApi {
	Settings = "/partner/settings",
	Password = "/partner/settings/password",
}

export interface PartnerNotificationSettings {
	newBooking: boolean;
	newReview: boolean;
	customerMessage: boolean;
}

export interface PartnerAccountSettings {
	email: string;
	phone: string;
}

export interface PartnerSettingsData {
	account: PartnerAccountSettings;
	notifications: PartnerNotificationSettings;
}

export interface SettingsResponse {
	settings: PartnerSettingsData;
}

const getSettings = () =>
	apiClient.get<SettingsResponse>({ url: PartnerSettingsApi.Settings });

const updateSettings = (data: Partial<PartnerSettingsData>) =>
	apiClient.put<SettingsResponse>({ url: PartnerSettingsApi.Settings, data });

const changePassword = (data: { currentPassword: string; newPassword: string }) =>
	apiClient.post({ url: PartnerSettingsApi.Password, data });

export default {
	getSettings,
	updateSettings,
	changePassword,
};
