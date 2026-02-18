import { useCallback, useEffect } from "react";
import { UserRole } from "@/api/services/authService";
import { useRouter } from "@/routes/hooks";
import { useCurrentRole, usePartnerToken } from "@/store/authStore";

interface Props {
	children: React.ReactNode;
}

export default function PartnerAuthGuard({ children }: Props) {
	const router = useRouter();
	const { accessToken } = usePartnerToken();
	const currentRole = useCurrentRole();

	const check = useCallback(() => {
		if (!accessToken || currentRole !== UserRole.PARTNER) {
			router.replace("/auth/login");
		}
	}, [router, accessToken, currentRole]);

	useEffect(() => {
		check();
	}, [check]);

	return <>{children}</>;
}
