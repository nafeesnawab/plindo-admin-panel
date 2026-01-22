import { useCallback, useEffect } from "react";
import { useRouter } from "@/routes/hooks";

interface Props {
	children: React.ReactNode;
}

export default function PartnerAuthGuard({ children }: Props) {
	const router = useRouter();

	const check = useCallback(() => {
		const partnerToken = localStorage.getItem("partnerToken");
		if (!partnerToken) {
			router.replace("/partner/login");
		}
	}, [router]);

	useEffect(() => {
		check();
	}, [check]);

	return <>{children}</>;
}
