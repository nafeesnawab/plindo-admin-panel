import { faker } from "@faker-js/faker";
import { HttpResponse, http } from "msw";
import { PartnerAuthApi } from "@/api/services/partnerAuthService";
import { ResultStatus } from "@/types/enum";

// In-memory storage for partner applications
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

// Add some demo applications
partnerApplications.set("pending@demo.com", {
	id: faker.string.uuid(),
	status: "pending",
	submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
	businessName: "Premium Car Wash",
	email: "pending@demo.com",
	password: "demo123",
});

partnerApplications.set("approved@demo.com", {
	id: faker.string.uuid(),
	status: "approved",
	submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
	reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
	businessName: "Sparkle Auto Wash",
	email: "approved@demo.com",
	password: "demo123",
});

partnerApplications.set("rejected@demo.com", {
	id: faker.string.uuid(),
	status: "rejected",
	rejectionReason:
		"Business license document was not readable. Please resubmit with a clearer copy.",
	submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
	reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
	businessName: "Quick Wash Services",
	email: "rejected@demo.com",
	password: "demo123",
});

const registerPartner = http.post(
	`/api${PartnerAuthApi.Register}`,
	async ({ request }) => {
		// Simulate processing time
		await new Promise((resolve) => setTimeout(resolve, 1500));

		try {
			const formData = await request.formData();
			const businessInfoStr = formData.get("businessInfo") as string;
			const businessInfo = JSON.parse(businessInfoStr);

			// Check if email already exists
			if (partnerApplications.has(businessInfo.email)) {
				return HttpResponse.json({
					status: 10002,
					message: "An application with this email already exists.",
				});
			}

			const applicationId = faker.string.uuid();

			// Store the application
			partnerApplications.set(businessInfo.email, {
				id: applicationId,
				status: "pending",
				submittedAt: new Date().toISOString(),
				businessName: businessInfo.businessName,
				email: businessInfo.email,
				password: businessInfo.password,
			});

			return HttpResponse.json({
				status: ResultStatus.SUCCESS,
				message: "Application submitted successfully",
				data: {
					applicationId,
					message: "Your application has been submitted and is under review.",
				},
			});
		} catch {
			return HttpResponse.json({
				status: 10001,
				message: "Failed to process application. Please try again.",
			});
		}
	},
);

const getApplicationStatus = http.get(
	`/api${PartnerAuthApi.ApplicationStatus}`,
	async ({ request }) => {
		const url = new URL(request.url);
		const email = url.searchParams.get("email");

		if (!email) {
			return HttpResponse.json({
				status: 10001,
				message: "Email is required",
			});
		}

		const application = partnerApplications.get(email);

		if (!application) {
			return HttpResponse.json(
				{
					status: 10001,
					message: "No application found with this email",
				},
				{ status: 404 },
			);
		}

		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			message: "",
			data: {
				id: application.id,
				status: application.status,
				rejectionReason: application.rejectionReason,
				submittedAt: application.submittedAt,
				reviewedAt: application.reviewedAt,
				businessName: application.businessName,
				email: application.email,
			},
		});
	},
);

const checkEmailAvailability = http.get(
	`/api${PartnerAuthApi.CheckEmail}`,
	async ({ request }) => {
		const url = new URL(request.url);
		const email = url.searchParams.get("email");

		if (!email) {
			return HttpResponse.json({
				status: 10001,
				message: "Email is required",
			});
		}

		const exists = partnerApplications.has(email);

		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			message: "",
			data: {
				available: !exists,
			},
		});
	},
);

const partnerSignIn = http.post(
	`/api${PartnerAuthApi.Login}`,
	async ({ request }) => {
		const { email, password } = (await request.json()) as {
			email: string;
			password: string;
		};

		const application = partnerApplications.get(email);

		if (!application) {
			return HttpResponse.json({
				status: 10001,
				message: "Invalid email or password",
			});
		}

		if (application.password !== password) {
			return HttpResponse.json({
				status: 10001,
				message: "Invalid email or password",
			});
		}

		if (application.status !== "approved") {
			return HttpResponse.json({
				status: 10003,
				message:
					"Your account is not active. Please check your application status.",
				data: {
					partner: {
						id: application.id,
						businessName: application.businessName,
						email: application.email,
						status: application.status,
					},
				},
			});
		}

		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			message: "",
			data: {
				partner: {
					id: application.id,
					businessName: application.businessName,
					email: application.email,
					status: "active",
					avatar: faker.image.avatarGitHub(),
				},
				accessToken: faker.string.uuid(),
				refreshToken: faker.string.uuid(),
			},
		});
	},
);

export const partnerAuthHandlers = [
	registerPartner,
	getApplicationStatus,
	checkEmailAvailability,
	partnerSignIn,
];
