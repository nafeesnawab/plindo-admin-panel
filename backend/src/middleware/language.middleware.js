import jwt from "jsonwebtoken";
import i18next, { i18nReady } from "../config/i18n.js";
import Customer from "../models/Customer.model.js";

const SUPPORTED = ["en", "el", "ar", "ro", "ru"];

/**
 * Language middleware for mobile API requests.
 * Decodes the JWT (without verifying) to get user ID, looks up their stored
 * language preference, and binds req.t to the correct i18next translation function.
 * Falls back to Accept-Language header, then "en".
 */
export const setLanguage = async (req, _res, next) => {
	try {
		await i18nReady;

		let language = "en";

		// Decode JWT (no verify — just to read the user ID) to get stored language
		const authHeader = req.headers.authorization;
		if (authHeader?.startsWith("Bearer ")) {
			try {
				const token = authHeader.split(" ")[1];
				const decoded = jwt.decode(token);
				if (decoded?.id && decoded?.role === "customer") {
					const customer = await Customer.findById(decoded.id).select(
						"language",
					);
					if (customer?.language && SUPPORTED.includes(customer.language)) {
						language = customer.language;
					}
				}
			} catch {
				// ignore — fall through to next detection
			}
		}

		// Fallback to Accept-Language header
		if (language === "en" && req.headers["accept-language"]) {
			const acceptLang = req.headers["accept-language"]
				.split(",")[0]
				.split("-")[0];
			if (SUPPORTED.includes(acceptLang)) {
				language = acceptLang;
			}
		}

		req.language = language;
		req.t = i18next.getFixedT(language);
		next();
	} catch {
		req.language = "en";
		req.t = i18next.getFixedT ? i18next.getFixedT("en") : (key) => key;
		next();
	}
};
