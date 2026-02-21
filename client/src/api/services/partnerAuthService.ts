import type { PartnerApplication } from "@/types/partner";
import apiClient from "../apiClient";

export enum PartnerAuthApi {
	Register = "/partner/register",
	ApplicationStatus = "/partner/application-status",
	Login = "/partner/login",
	CheckEmail = "/partner/check-email",
}

export interface PartnerSignInReq {
	email: string;
	password: string;
}

export interface PartnerSignInRes {
	partner: {
		id: string;
		businessName: string;
		email: string;
		status: string;
		avatar?: string;
	};
	accessToken: string;
	refreshToken: string;
}

const registerPartner = (data: FormData) =>
	apiClient.post<{ applicationId: string; message: string }>({
		url: PartnerAuthApi.Register,
		data,
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});

const getApplicationStatus = (email: string) =>
	apiClient.get<{ application: PartnerApplication }>({
		url: PartnerAuthApi.ApplicationStatus,
		params: { email },
	}).then((data) => data.application);

const checkEmailAvailability = (email: string) =>
	apiClient.get<{ available: boolean }>({
		url: PartnerAuthApi.CheckEmail,
		params: { email },
	});

const partnerSignIn = (data: PartnerSignInReq) => apiClient.post<PartnerSignInRes>({ url: PartnerAuthApi.Login, data });

export default {
	registerPartner,
	getApplicationStatus,
	checkEmailAvailability,
	partnerSignIn,
};
