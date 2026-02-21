import express from "express";

// Auth controller
import {
	forgotPassword,
	getMe,
	refreshToken,
	resetPassword,
	sendOtp,
	signin,
	signup,
	verifyOtp,
} from "../controllers/mobile/auth.controller.js";

// Profile controller
import {
	addPaymentMethod,
	addVehicle,
	changePassword,
	deleteAccount,
	deletePaymentMethod,
	deleteVehicle,
	getBookingsSummary,
	getCarBodyTypes,
	getCarMakes,
	getCarModels,
	getPaymentMethods,
	getProfile,
	getVehicles,
	logout,
	updateProfile,
	updateVehicle,
} from "../controllers/mobile/profile.controller.js";

// Partners controller
import {
	getPartnerDetails,
	getPartnerProducts,
	getPartnerReviews,
	getPartnerServices,
	getPartners,
} from "../controllers/mobile/partners.controller.js";

// Bookings controller
import {
	calculatePrice,
	cancelBooking,
	createBooking,
	getAvailableSlots,
	getBookingDetails,
	getBookings,
	submitReview,
} from "../controllers/mobile/bookings.controller.js";

// Subscriptions controller
import {
	cancelSubscription,
	getCurrentSubscription,
	getSubscriptionPlans,
	subscribe,
} from "../controllers/mobile/subscriptions.controller.js";

// Messaging controller
import {
	getConversations,
	getMessages,
	sendMessage,
	startConversation,
} from "../controllers/mobile/messaging.controller.js";

import { protectCustomer } from "../middleware/auth.middleware.js";

const router = express.Router();

// ─── Public Routes (No Auth Required) ───────────────────────────────────────

// Auth
router.post("/auth/send-otp", sendOtp);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/signup", signup);
router.post("/auth/signin", signin);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);
router.post("/auth/refresh-token", refreshToken);

// Car registry (public)
router.get("/cars/makes", getCarMakes);
router.get("/cars/models/:make", getCarModels);
router.get("/cars/body-types", getCarBodyTypes);

// Subscription plans (public)
router.get("/subscriptions/plans", getSubscriptionPlans);

// ─── Protected Routes (Auth Required) ───────────────────────────────────────

router.use(protectCustomer);

// Profile
router.get("/auth/me", getMe);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/profile/password", changePassword);
router.delete("/profile", deleteAccount);
router.post("/profile/logout", logout);
router.get("/profile/bookings-summary", getBookingsSummary);

// Vehicles
router.get("/vehicles", getVehicles);
router.post("/vehicles", addVehicle);
router.put("/vehicles/:id", updateVehicle);
router.delete("/vehicles/:id", deleteVehicle);

// Payment methods
router.get("/payment-methods", getPaymentMethods);
router.post("/payment-methods", addPaymentMethod);
router.delete("/payment-methods/:id", deletePaymentMethod);

// Partners discovery
router.get("/partners", getPartners);
router.get("/partners/:id", getPartnerDetails);
router.get("/partners/:id/services", getPartnerServices);
router.get("/partners/:id/products", getPartnerProducts);
router.get("/partners/:id/reviews", getPartnerReviews);
router.get("/partners/:partnerId/slots", getAvailableSlots);

// Bookings
router.post("/bookings/calculate-price", calculatePrice);
router.post("/bookings", createBooking);
router.get("/bookings", getBookings);
router.get("/bookings/:id", getBookingDetails);
router.post("/bookings/:id/cancel", cancelBooking);
router.post("/bookings/:id/review", submitReview);

// Subscriptions
router.get("/subscriptions/current", getCurrentSubscription);
router.post("/subscriptions/subscribe", subscribe);
router.post("/subscriptions/cancel", cancelSubscription);

// Messaging
router.get("/conversations", getConversations);
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:partnerId/start", startConversation);
router.post("/conversations/:id/messages", sendMessage);

export default router;
