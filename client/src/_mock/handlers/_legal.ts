import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

import { ResultStatus } from "@/types/enum";

enum LegalApi {
	TermsConditions = "/legal/terms",
	TermsHistory = "/legal/terms/history",
	PrivacyPolicy = "/legal/privacy",
	PrivacyHistory = "/legal/privacy/history",
	RefundPolicy = "/legal/refund",
	AboutUs = "/legal/about",
	FAQs = "/legal/faqs",
}

const generateVersion = (version: number, type: string) => ({
	id: faker.string.uuid(),
	version: `${version}.0`,
	content: `<h1>${type}</h1><p>This is version ${version}.0 of the ${type}. Last updated on ${faker.date.past().toISOString().split("T")[0]}.</p><h2>Section 1</h2><p>${faker.lorem.paragraphs(3)}</p><h2>Section 2</h2><p>${faker.lorem.paragraphs(2)}</p><h2>Section 3</h2><p>${faker.lorem.paragraphs(2)}</p>`,
	publishedAt: faker.date.past().toISOString(),
	publishedBy: faker.person.fullName(),
	isActive: version === 3,
});

const termsVersions = [
	generateVersion(3, "Terms & Conditions"),
	generateVersion(2, "Terms & Conditions"),
	generateVersion(1, "Terms & Conditions"),
];

const privacyVersions = [
	generateVersion(3, "Privacy Policy"),
	generateVersion(2, "Privacy Policy"),
	generateVersion(1, "Privacy Policy"),
];

let refundPolicy = {
	id: faker.string.uuid(),
	content: `<h1>Refund Policy</h1><p>At PLINDO, we strive to ensure customer satisfaction. This refund policy outlines the conditions under which refunds may be issued.</p><h2>Eligibility for Refunds</h2><p>${faker.lorem.paragraphs(2)}</p><h2>Refund Process</h2><p>${faker.lorem.paragraphs(2)}</p><h2>Non-Refundable Items</h2><p>${faker.lorem.paragraphs(1)}</p>`,
	updatedAt: faker.date.recent().toISOString(),
	updatedBy: faker.person.fullName(),
};

let aboutUs = {
	id: faker.string.uuid(),
	companyName: "PLINDO",
	tagline: "Your trusted car wash booking platform",
	description: `<p>PLINDO is a revolutionary platform connecting car owners with professional car wash services. Founded in 2023, we've grown to serve thousands of customers across multiple cities.</p><h2>Our Mission</h2><p>To make car care convenient, accessible, and eco-friendly for everyone.</p><h2>Our Vision</h2><p>To become the leading car wash booking platform globally, setting new standards for quality and customer service.</p>`,
	email: "contact@plindo.com",
	phone: "+1 (555) 123-4567",
	address: "123 Main Street, Suite 100, San Francisco, CA 94102",
	socialLinks: {
		facebook: "https://facebook.com/plindo",
		twitter: "https://twitter.com/plindo",
		instagram: "https://instagram.com/plindo",
		linkedin: "https://linkedin.com/company/plindo",
	},
	updatedAt: faker.date.recent().toISOString(),
};

const faqCategories = ["General", "Booking", "Payment", "Partners", "Account"];

let faqs = Array.from({ length: 15 }, (_, i) => ({
	id: faker.string.uuid(),
	question: faker.helpers.arrayElement([
		"How do I book a car wash?",
		"What payment methods are accepted?",
		"Can I cancel my booking?",
		"How do I become a partner?",
		"Is my payment information secure?",
		"What happens if the partner doesn't show up?",
		"How do I update my vehicle information?",
		"What are the service hours?",
		"Do you offer subscription plans?",
		"How do I contact customer support?",
		"Can I reschedule my booking?",
		"What services are included in a basic wash?",
		"How do I leave a review?",
		"What is the cancellation policy?",
		"How do partners get paid?",
	]),
	answer: `<p>${faker.lorem.paragraphs(2)}</p>`,
	category: faker.helpers.arrayElement(faqCategories),
	order: i + 1,
	isActive: faker.datatype.boolean({ probability: 0.9 }),
	createdAt: faker.date.past().toISOString(),
	updatedAt: faker.date.recent().toISOString(),
}));

const getTermsConditions = http.get(`/api${LegalApi.TermsConditions}`, () => {
	const activeVersion = termsVersions.find((v) => v.isActive) || termsVersions[0];
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: activeVersion,
	});
});

const getTermsHistory = http.get(`/api${LegalApi.TermsHistory}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: termsVersions,
	});
});

const updateTermsConditions = http.put(`/api${LegalApi.TermsConditions}`, async ({ request }) => {
	const body = (await request.json()) as { content: string; publish?: boolean };
	const newVersion = {
		id: faker.string.uuid(),
		version: `${termsVersions.length + 1}.0`,
		content: body.content,
		publishedAt: new Date().toISOString(),
		publishedBy: "Admin User",
		isActive: body.publish ?? false,
	};
	if (body.publish) {
		termsVersions.forEach((v) => (v.isActive = false));
		newVersion.isActive = true;
	}
	termsVersions.unshift(newVersion);
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: body.publish ? "Terms published successfully" : "Draft saved",
		data: newVersion,
	});
});

const getPrivacyPolicy = http.get(`/api${LegalApi.PrivacyPolicy}`, () => {
	const activeVersion = privacyVersions.find((v) => v.isActive) || privacyVersions[0];
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: activeVersion,
	});
});

const getPrivacyHistory = http.get(`/api${LegalApi.PrivacyHistory}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: privacyVersions,
	});
});

const updatePrivacyPolicy = http.put(`/api${LegalApi.PrivacyPolicy}`, async ({ request }) => {
	const body = (await request.json()) as { content: string; publish?: boolean };
	const newVersion = {
		id: faker.string.uuid(),
		version: `${privacyVersions.length + 1}.0`,
		content: body.content,
		publishedAt: new Date().toISOString(),
		publishedBy: "Admin User",
		isActive: body.publish ?? false,
	};
	if (body.publish) {
		privacyVersions.forEach((v) => (v.isActive = false));
		newVersion.isActive = true;
	}
	privacyVersions.unshift(newVersion);
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: body.publish ? "Privacy policy published" : "Draft saved",
		data: newVersion,
	});
});

const getRefundPolicy = http.get(`/api${LegalApi.RefundPolicy}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: refundPolicy,
	});
});

const updateRefundPolicy = http.put(`/api${LegalApi.RefundPolicy}`, async ({ request }) => {
	const body = (await request.json()) as { content: string };
	refundPolicy = {
		...refundPolicy,
		content: body.content,
		updatedAt: new Date().toISOString(),
		updatedBy: "Admin User",
	};
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Refund policy updated",
		data: refundPolicy,
	});
});

const getAboutUs = http.get(`/api${LegalApi.AboutUs}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: aboutUs,
	});
});

const updateAboutUs = http.put(`/api${LegalApi.AboutUs}`, async ({ request }) => {
	const body = (await request.json()) as Partial<typeof aboutUs>;
	aboutUs = {
		...aboutUs,
		...body,
		updatedAt: new Date().toISOString(),
	};
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "About Us updated",
		data: aboutUs,
	});
});

const getFAQs = http.get(`/api${LegalApi.FAQs}`, ({ request }) => {
	const url = new URL(request.url);
	const category = url.searchParams.get("category");
	let filtered = [...faqs];
	if (category && category !== "all") {
		filtered = filtered.filter((f) => f.category === category);
	}
	filtered.sort((a, b) => a.order - b.order);
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: { faqs: filtered, categories: faqCategories },
	});
});

const createFAQ = http.post(`/api${LegalApi.FAQs}`, async ({ request }) => {
	const body = (await request.json()) as {
		question: string;
		answer: string;
		category: string;
	};
	const newFaq = {
		id: faker.string.uuid(),
		...body,
		order: faqs.length + 1,
		isActive: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	faqs.push(newFaq);
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "FAQ created",
		data: newFaq,
	});
});

const updateFAQ = http.put(`/api${LegalApi.FAQs}/:id`, async ({ params, request }) => {
	const { id } = params;
	const body = (await request.json()) as Partial<(typeof faqs)[0]>;
	const index = faqs.findIndex((f) => f.id === id);
	if (index !== -1) {
		faqs[index] = { ...faqs[index], ...body, updatedAt: new Date().toISOString() };
		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			message: "FAQ updated",
			data: faqs[index],
		});
	}
	return HttpResponse.json({ status: ResultStatus.ERROR, message: "FAQ not found" }, { status: 404 });
});

const deleteFAQ = http.delete(`/api${LegalApi.FAQs}/:id`, ({ params }) => {
	const { id } = params;
	faqs = faqs.filter((f) => f.id !== id);
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "FAQ deleted",
	});
});

const reorderFAQs = http.put(`/api${LegalApi.FAQs}/reorder`, async ({ request }) => {
	const body = (await request.json()) as { ids: string[] };
	body.ids.forEach((id, index) => {
		const faq = faqs.find((f) => f.id === id);
		if (faq) faq.order = index + 1;
	});
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "FAQs reordered",
	});
});

export const legalHandlers = [
	getTermsConditions,
	getTermsHistory,
	updateTermsConditions,
	getPrivacyPolicy,
	getPrivacyHistory,
	updatePrivacyPolicy,
	getRefundPolicy,
	updateRefundPolicy,
	getAboutUs,
	updateAboutUs,
	getFAQs,
	createFAQ,
	updateFAQ,
	deleteFAQ,
	reorderFAQs,
];
