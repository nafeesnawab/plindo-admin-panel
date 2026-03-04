/**
 * Returns pre-populated serviceSteps for a booking based on serviceType and serviceCategory.
 * First step "Confirmed" is auto-completed at creation time.
 * Remaining steps start as "pending" and are advanced by the partner.
 */
export const getInitialServiceSteps = (serviceType, serviceCategory) => {
	const isDetailing = serviceCategory === "detailing";
	const now = new Date();

	if (serviceType === "pick_by_me") {
		const steps = [
			{ name: "Confirmed", order: 1, status: "completed", completedAt: now },
			{ name: "Driver Assigned", order: 2, status: "pending" },
			{ name: "En Route to Pickup", order: 3, status: "pending" },
			{ name: "Car Picked Up", order: 4, status: "pending" },
			{ name: "Washing", order: 5, status: "pending" },
			{ name: "Drying", order: 6, status: "pending" },
		];
		if (isDetailing) {
			steps.push({ name: "Interior Cleaning", order: 7, status: "pending" });
			steps.push({ name: "Ready for Delivery", order: 8, status: "pending" });
			steps.push({ name: "Out for Delivery", order: 9, status: "pending" });
			steps.push({ name: "Delivered", order: 10, status: "pending" });
		} else {
			steps.push({ name: "Ready for Delivery", order: 7, status: "pending" });
			steps.push({ name: "Out for Delivery", order: 8, status: "pending" });
			steps.push({ name: "Delivered", order: 9, status: "pending" });
		}
		return steps;
	}

	if (serviceType === "washing_van") {
		const steps = [
			{ name: "Confirmed", order: 1, status: "completed", completedAt: now },
			{ name: "En Route to You", order: 2, status: "pending" },
			{ name: "Arrived", order: 3, status: "pending" },
			{ name: "Washing", order: 4, status: "pending" },
			{ name: "Drying", order: 5, status: "pending" },
		];
		if (isDetailing) {
			steps.push({ name: "Interior Cleaning", order: 6, status: "pending" });
			steps.push({ name: "Completed", order: 7, status: "pending" });
		} else {
			steps.push({ name: "Completed", order: 6, status: "pending" });
		}
		return steps;
	}

	// book_me (default)
	const steps = [
		{ name: "Confirmed", order: 1, status: "completed", completedAt: now },
		{ name: "Washing", order: 2, status: "pending" },
		{ name: "Drying", order: 3, status: "pending" },
	];
	if (isDetailing) {
		steps.push({ name: "Interior Cleaning", order: 4, status: "pending" });
		steps.push({ name: "Completed", order: 5, status: "pending" });
	} else {
		steps.push({ name: "Completed", order: 4, status: "pending" });
	}
	return steps;
};

/**
 * Returns the final top-level booking status when all steps are done.
 */
export const getFinalBookingStatus = (serviceType) => {
	return serviceType === "pick_by_me" ? "delivered" : "completed";
};
