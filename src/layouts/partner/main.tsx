import { Outlet } from "react-router";

export default function PartnerMain() {
	return (
		<main className="flex-1 p-6">
			<Outlet />
		</main>
	);
}
