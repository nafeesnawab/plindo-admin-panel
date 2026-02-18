import { useCallback, useEffect } from "react";
import { UserRole } from "@/api/services/authService";
import { useCurrentRole, useUserToken } from "@/store/authStore";
import { useRouter } from "../hooks";

type Props = {
	children: React.ReactNode;
};
export default function LoginAuthGuard({ children }: Props) {
	const router = useRouter();
	const { accessToken } = useUserToken();
	const currentRole = useCurrentRole();

	const check = useCallback(() => {
		if (!accessToken || currentRole !== UserRole.ADMIN) {
			router.replace("/auth/login");
		}
	}, [router, accessToken, currentRole]);

	useEffect(() => {
		check();
	}, [check]);

	return <>{children}</>;
}
