import { createContext, type ReactNode, useContext, useState } from "react";
import type { BusinessDetails, BusinessDocuments, BusinessInfo, Driver } from "@/types/partner";
import { createEmptyDriver, INITIAL_BUSINESS_DETAILS, INITIAL_BUSINESS_INFO, INITIAL_DOCUMENTS } from "@/types/partner";
import type { ServiceCategory } from "@/types/booking";

const DEFAULT_SCHEDULE = [
	{ dayOfWeek: 0, dayName: "Sunday", isEnabled: false, timeBlocks: [] },
	{ dayOfWeek: 1, dayName: "Monday", isEnabled: false, timeBlocks: [] },
	{ dayOfWeek: 2, dayName: "Tuesday", isEnabled: false, timeBlocks: [] },
	{ dayOfWeek: 3, dayName: "Wednesday", isEnabled: false, timeBlocks: [] },
	{ dayOfWeek: 4, dayName: "Thursday", isEnabled: false, timeBlocks: [] },
	{ dayOfWeek: 5, dayName: "Friday", isEnabled: false, timeBlocks: [] },
	{ dayOfWeek: 6, dayName: "Saturday", isEnabled: false, timeBlocks: [] },
];

interface RegistrationContextType {
	currentStep: number;
	setCurrentStep: (step: number) => void;
	nextStep: () => void;
	prevStep: () => void;

	businessInfo: BusinessInfo;
	setBusinessInfo: (info: BusinessInfo) => void;

	documents: BusinessDocuments;
	setDocuments: (docs: BusinessDocuments) => void;

	drivers: Driver[];
	setDrivers: (drivers: Driver[]) => void;
	addDriver: () => void;
	removeDriver: (id: string) => void;
	updateDriver: (id: string, data: Partial<Driver>) => void;

	schedule: any[];
	setSchedule: (schedule: any[]) => void;
	capacityByCategory: Record<ServiceCategory, number>;
	setCapacityByCategory: (capacity: Record<ServiceCategory, number>) => void;
	bufferTime: number;
	setBufferTime: (time: number) => void;

	businessDetails: BusinessDetails;
	setBusinessDetails: (details: BusinessDetails) => void;

	isSubmitting: boolean;
	setIsSubmitting: (submitting: boolean) => void;

	getFormData: () => FormData;
	resetForm: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | null>(null);

export function PartnerRegistrationProvider({ children }: { children: ReactNode }) {
	const [currentStep, setCurrentStep] = useState(1);
	const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(INITIAL_BUSINESS_INFO);
	const [documents, setDocuments] = useState<BusinessDocuments>(INITIAL_DOCUMENTS);
	const [drivers, setDrivers] = useState<Driver[]>([createEmptyDriver()]);
	const [schedule, setSchedule] = useState<any[]>(DEFAULT_SCHEDULE);
	const [capacityByCategory, setCapacityByCategory] = useState<Record<ServiceCategory, number>>({ wash: 0, detailing: 0, other: 0 });
	const [bufferTime, setBufferTime] = useState(15);
	const [businessDetails, setBusinessDetails] = useState<BusinessDetails>(INITIAL_BUSINESS_DETAILS);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 6));
	const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

	const addDriver = () => {
		setDrivers((prev) => [...prev, createEmptyDriver()]);
	};

	const removeDriver = (id: string) => {
		setDrivers((prev) => prev.filter((d) => d.id !== id));
	};

	const updateDriver = (id: string, data: Partial<Driver>) => {
		setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
	};

	const resetForm = () => {
		setCurrentStep(1);
		setBusinessInfo(INITIAL_BUSINESS_INFO);
		setDocuments(INITIAL_DOCUMENTS);
		setDrivers([createEmptyDriver()]);
		setSchedule(DEFAULT_SCHEDULE);
		setCapacityByCategory({ wash: 0, detailing: 0, other: 0 });
		setBufferTime(15);
		setBusinessDetails(INITIAL_BUSINESS_DETAILS);
		setIsSubmitting(false);
	};

	const getFormData = (): FormData => {
		const formData = new FormData();

		// Business Info
		formData.append("businessInfo", JSON.stringify(businessInfo));

		// Documents
		if (documents.businessRegistration) {
			formData.append("businessRegistration", documents.businessRegistration);
		}
		if (documents.businessInsurance) {
			formData.append("businessInsurance", documents.businessInsurance);
		}
		if (documents.motorTradeInsurance) {
			formData.append("motorTradeInsurance", documents.motorTradeInsurance);
		}

		// Drivers (without file objects)
		const driversData = drivers.map((d) => ({
			id: d.id,
			fullName: d.fullName,
			contactNumber: d.contactNumber,
		}));
		formData.append("drivers", JSON.stringify(driversData));

		// Driver documents
		drivers.forEach((driver, index) => {
			if (driver.driverLicense) {
				formData.append(`driverLicense_${index}`, driver.driverLicense);
			}
			if (driver.driverInsurance) {
				formData.append(`driverInsurance_${index}`, driver.driverInsurance);
			}
		});

		// Schedule & Capacity
		formData.append("schedule", JSON.stringify(schedule));
		formData.append("capacityByCategory", JSON.stringify(capacityByCategory));
		formData.append("bufferTime", JSON.stringify(bufferTime));

		// Business Details (without file objects)
		const detailsData = {
			description: businessDetails.description,
			serviceRadius: businessDetails.serviceRadius,
		};
		formData.append("businessDetails", JSON.stringify(detailsData));

		// Business Detail files
		if (businessDetails.logo) {
			formData.append("logo", businessDetails.logo);
		}
		if (businessDetails.coverPhoto) {
			formData.append("coverPhoto", businessDetails.coverPhoto);
		}
		businessDetails.workPhotos.forEach((photo, index) => {
			formData.append(`workPhoto_${index}`, photo);
		});

		return formData;
	};

	return (
		<RegistrationContext.Provider
			value={{
				currentStep,
				setCurrentStep,
				nextStep,
				prevStep,
				businessInfo,
				setBusinessInfo,
				documents,
				setDocuments,
				drivers,
				setDrivers,
				addDriver,
				removeDriver,
				updateDriver,
				schedule,
				setSchedule,
				capacityByCategory,
				setCapacityByCategory,
				bufferTime,
				setBufferTime,
				businessDetails,
				setBusinessDetails,
				isSubmitting,
				setIsSubmitting,
				getFormData,
				resetForm,
			}}
		>
			{children}
		</RegistrationContext.Provider>
	);
}

export function usePartnerRegistration() {
	const context = useContext(RegistrationContext);
	if (!context) {
		throw new Error("usePartnerRegistration must be used within PartnerRegistrationProvider");
	}
	return context;
}
