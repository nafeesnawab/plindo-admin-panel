import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";
import { AuthApi, UserRole } from "@/api/services/authService";
import { ResultStatus } from "@/types/enum";
import { convertFlatToTree } from "@/utils/tree";
import { DB_MENU, DB_PERMISSION, DB_ROLE, DB_ROLE_PERMISSION, DB_USER, DB_USER_ROLE } from "../assets_backup";

// Import partner applications from partner-auth handler
const partnerApplications: Map<
	string,
	{
		id: string;
		status: "pending" | "approved" | "rejected";
		rejectionReason?: string;
		submittedAt: string;
		reviewedAt?: string;
		businessName: string;
		email: string;
		password: string;
	}
> = new Map();

// Add demo partner accounts
partnerApplications.set("approved@demo.com", {
	id: faker.string.uuid(),
	status: "approved",
	submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
	reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
	businessName: "Sparkle Auto Wash",
	email: "approved@demo.com",
	password: "demo123",
});

partnerApplications.set("pending@demo.com", {
	id: faker.string.uuid(),
	status: "pending",
	submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
	businessName: "Premium Car Wash",
	email: "pending@demo.com",
	password: "demo123",
});

const unifiedSignIn = http.post(`/api${AuthApi.UnifiedSignIn}`, async ({ request }) => {
	const { email, password } = (await request.json()) as { email: string; password: string };

	// Try admin login first
	const adminUser = DB_USER.find((item) => item.username === email || item.email === email);

	if (adminUser && adminUser.password === password) {
		const { password: _, ...userWithoutPassword } = adminUser;

		// user role
		const roles = DB_USER_ROLE.filter((item) => item.userId === adminUser.id).map((item) =>
			DB_ROLE.find((role) => role.id === item.roleId),
		);

		// user permissions
		const permissions = DB_ROLE_PERMISSION.filter((item) => roles.some((role) => role?.id === item.roleId)).map(
			(item) => DB_PERMISSION.find((permission) => permission.id === item.permissionId),
		);

		const menu = convertFlatToTree(DB_MENU);

		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			message: "",
			data: {
				user: { ...userWithoutPassword, roles, permissions, menu },
				accessToken: faker.string.uuid(),
				refreshToken: faker.string.uuid(),
				role: UserRole.ADMIN,
			},
		});
	}

	// Try partner login
	const partnerApplication = partnerApplications.get(email);

	if (partnerApplication && partnerApplication.password === password) {
		const partnerStatus = partnerApplication.status === "approved" ? "active" : partnerApplication.status;

		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			message: "",
			data: {
				partner: {
					id: partnerApplication.id,
					businessName: partnerApplication.businessName,
					email: partnerApplication.email,
					status: partnerStatus,
					avatar: faker.image.avatarGitHub(),
				},
				accessToken: faker.string.uuid(),
				refreshToken: faker.string.uuid(),
				role: UserRole.PARTNER,
			},
		});
	}

	// Invalid credentials
	return HttpResponse.json({
		status: 10001,
		message: "Invalid email or password.",
	});
});

export { unifiedSignIn };
