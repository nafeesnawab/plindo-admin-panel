// Partner Registration Types

export interface Driver {
	id: string;
	fullName: string;
	contactNumber: string;
	driverLicense: File | null;
	driverLicensePreview?: string;
	driverInsurance: File | null;
	driverInsurancePreview?: string;
}

export interface WorkingHoursDay {
	isOpen: boolean;
	openTime: string;
	closeTime: string;
}

export type WeeklyWorkingHours = {
	monday: WorkingHoursDay;
	tuesday: WorkingHoursDay;
	wednesday: WorkingHoursDay;
	thursday: WorkingHoursDay;
	friday: WorkingHoursDay;
	saturday: WorkingHoursDay;
	sunday: WorkingHoursDay;
};

export interface BusinessInfo {
	businessName: string;
	businessLicenseNumber: string;
	contactPersonName: string;
	email: string;
	phone: string;
	address: string;
	latitude: number | null;
	longitude: number | null;
}

export interface BusinessDocuments {
	businessRegistration: File | null;
	businessRegistrationPreview?: string;
	businessInsurance: File | null;
	businessInsurancePreview?: string;
	motorTradeInsurance: File | null;
	motorTradeInsurancePreview?: string;
}

export interface BusinessDetails {
	logo: File | null;
	logoPreview?: string;
	coverPhoto: File | null;
	coverPhotoPreview?: string;
	workPhotos: File[];
	workPhotosPreview: string[];
	description: string;
	serviceRadius: number;
	workingHours: WeeklyWorkingHours;
}

export interface PartnerRegistrationData {
	businessInfo: BusinessInfo;
	documents: BusinessDocuments;
	drivers: Driver[];
	businessDetails: BusinessDetails;
}

export type PartnerApplicationStatus = "pending" | "approved" | "rejected";

export interface PartnerApplication {
	id: string;
	status: PartnerApplicationStatus;
	rejectionReason?: string;
	submittedAt: string;
	reviewedAt?: string;
	businessName: string;
	email: string;
}

export const DEFAULT_WORKING_HOURS: WeeklyWorkingHours = {
	monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
	tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
	wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
	thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
	friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
	saturday: { isOpen: true, openTime: "10:00", closeTime: "16:00" },
	sunday: { isOpen: false, openTime: "10:00", closeTime: "16:00" },
};

export const INITIAL_BUSINESS_INFO: BusinessInfo = {
	businessName: "",
	businessLicenseNumber: "",
	contactPersonName: "",
	email: "",
	phone: "",
	address: "",
	latitude: null,
	longitude: null,
};

export const INITIAL_DOCUMENTS: BusinessDocuments = {
	businessRegistration: null,
	businessInsurance: null,
	motorTradeInsurance: null,
};

export const INITIAL_BUSINESS_DETAILS: BusinessDetails = {
	logo: null,
	coverPhoto: null,
	workPhotos: [],
	workPhotosPreview: [],
	description: "",
	serviceRadius: 10,
	workingHours: DEFAULT_WORKING_HOURS,
};

export const createEmptyDriver = (): Driver => ({
	id: crypto.randomUUID(),
	fullName: "",
	contactNumber: "",
	driverLicense: null,
	driverInsurance: null,
});
