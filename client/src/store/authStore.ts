import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UserInfo } from "#/entity";
import { StorageEnum } from "#/enum";
import authService, { type UnifiedSignInReq, UserRole } from "@/api/services/authService";

interface PartnerInfo {
	id: string;
	businessName: string;
	email: string;
	status: string;
	avatar?: string;
}

type AuthStore = {
	userInfo: Partial<UserInfo>;
	partnerInfo: Partial<PartnerInfo>;
	userToken: { accessToken?: string; refreshToken?: string };
	partnerToken: { accessToken?: string; refreshToken?: string };
	currentRole: UserRole | null;

	actions: {
		setUserInfo: (userInfo: UserInfo) => void;
		setPartnerInfo: (partnerInfo: PartnerInfo) => void;
		setUserToken: (token: { accessToken?: string; refreshToken?: string }) => void;
		setPartnerToken: (token: { accessToken?: string; refreshToken?: string }) => void;
		setCurrentRole: (role: UserRole) => void;
		clearAuth: () => void;
	};
};

const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			userInfo: {},
			partnerInfo: {},
			userToken: {},
			partnerToken: {},
			currentRole: null,
			actions: {
				setUserInfo: (userInfo) => {
					set({ userInfo });
				},
				setPartnerInfo: (partnerInfo) => {
					set({ partnerInfo });
				},
				setUserToken: (userToken) => {
					set({ userToken });
				},
				setPartnerToken: (partnerToken) => {
					set({ partnerToken });
				},
				setCurrentRole: (role) => {
					set({ currentRole: role });
				},
				clearAuth() {
					set({
						userInfo: {},
						partnerInfo: {},
						userToken: {},
						partnerToken: {},
						currentRole: null,
					});
				},
			},
		}),
		{
			name: "authStore",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				[StorageEnum.UserInfo]: state.userInfo,
				[StorageEnum.UserToken]: state.userToken,
				partnerInfo: state.partnerInfo,
				partnerToken: state.partnerToken,
				currentRole: state.currentRole,
			}),
		},
	),
);

export const useUserInfo = () => useAuthStore((state) => state.userInfo);
export const usePartnerInfo = () => useAuthStore((state) => state.partnerInfo);
export const useUserToken = () => useAuthStore((state) => state.userToken);
export const usePartnerToken = () => useAuthStore((state) => state.partnerToken);
export const useCurrentRole = () => useAuthStore((state) => state.currentRole);
export const useUserPermissions = () => useAuthStore((state) => state.userInfo.permissions || []);
export const useUserRoles = () => useAuthStore((state) => state.userInfo.roles || []);
export const useAuthActions = () => useAuthStore((state) => state.actions);

export const useUnifiedSignIn = () => {
	const { setUserToken, setPartnerToken, setUserInfo, setPartnerInfo, setCurrentRole } = useAuthActions();

	const signInMutation = useMutation({
		mutationFn: authService.unifiedSignIn,
	});

	const signIn = async (data: UnifiedSignInReq) => {
		try {
			const res = await signInMutation.mutateAsync(data);

			if (res.role === UserRole.ADMIN) {
				const { user, accessToken, refreshToken } = res;
				setUserToken({ accessToken, refreshToken });
				setUserInfo(user);
				setCurrentRole(UserRole.ADMIN);
				return { role: UserRole.ADMIN, redirectTo: "/dashboard" };
			}

			if (res.role === UserRole.PARTNER) {
				const { partner, accessToken, refreshToken } = res;

				if (partner.status !== "active") {
					toast.error("Your account is not active. Please check your application status.");
					return { role: UserRole.PARTNER, redirectTo: "/partner/application-status", inactive: true };
				}

				setPartnerToken({ accessToken, refreshToken });
				setPartnerInfo(partner);
				setCurrentRole(UserRole.PARTNER);
				return { role: UserRole.PARTNER, redirectTo: "/partner/dashboard" };
			}

			throw new Error("Invalid role");
		} catch (err: any) {
			toast.error(err.message || "Invalid email or password", {
				position: "top-center",
			});
			throw err;
		}
	};

	return signIn;
};

// Backward compatible useSignIn for admin-only login (legacy support)
export const useSignIn = () => {
	const { setUserToken, setUserInfo, setCurrentRole } = useAuthActions();

	const signInMutation = useMutation({
		mutationFn: async (data: { username: string; password: string }) => {
			const userService = await import("@/api/services/userService");
			return userService.default.signin(data);
		},
	});

	const signIn = async (data: { username: string; password: string }) => {
		try {
			const res = await signInMutation.mutateAsync(data);
			const { user, accessToken, refreshToken } = res;
			setUserToken({ accessToken, refreshToken });
			setUserInfo(user);
			setCurrentRole(UserRole.ADMIN);
		} catch (err: any) {
			toast.error(err.message || "Login failed", {
				position: "top-center",
			});
			throw err;
		}
	};

	return signIn;
};

export default useAuthStore;
