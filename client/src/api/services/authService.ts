import type { UserInfo } from "#/entity";
import apiClient from "../apiClient";

export enum UserRole {
	ADMIN = "admin",
	PARTNER = "partner",
}

export interface UnifiedSignInReq {
	email: string;
	password: string;
}

export interface AdminSignInRes {
	user: UserInfo;
	accessToken: string;
	refreshToken: string;
	role: UserRole.ADMIN;
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
	role: UserRole.PARTNER;
}

export type UnifiedSignInRes = AdminSignInRes | PartnerSignInRes;

export enum AuthApi {
	UnifiedSignIn = "/auth/unified-signin",
}

const unifiedSignIn = (data: UnifiedSignInReq) =>
	apiClient.post<UnifiedSignInRes>({ url: AuthApi.UnifiedSignIn, data });

export default {
	unifiedSignIn,
};
