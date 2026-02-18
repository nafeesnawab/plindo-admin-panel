import { Tabs } from "antd";
import { useState } from "react";
import { Card, CardContent } from "@/ui/card";

// Import the existing page components as tabs
import AboutUsPage from "./about";
import FAQManagementPage from "./faqs";
import PrivacyPolicyPage from "./privacy";
import RefundPolicyPage from "./refund";
import TermsConditionsPage from "./terms";

export default function LegalPage() {
	const [activeTab, setActiveTab] = useState("terms");

	const tabItems = [
		{ key: "terms", label: "Terms & Conditions", children: <TermsConditionsPage /> },
		{ key: "privacy", label: "Privacy Policy", children: <PrivacyPolicyPage /> },
		{ key: "refund", label: "Refund Policy", children: <RefundPolicyPage /> },
		{ key: "about", label: "About Us", children: <AboutUsPage /> },
		{ key: "faqs", label: "FAQs", children: <FAQManagementPage /> },
	];

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardContent className="pt-4 flex-1 min-h-0 flex flex-col">
					<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="ant-tabs-flex-fill" />
				</CardContent>
			</Card>
		</div>
	);
}
