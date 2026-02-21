/**
 * One-time script to reset a partner's password.
 * Usage: node scripts/reset-partner-password.js <email> <newPassword>
 * Example: node scripts/reset-partner-password.js gocarwash@gmail.com gocarwasH1
 */
import "dotenv/config";
import mongoose from "mongoose";
import Partner from "../src/models/Partner.model.js";

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
	console.error("Usage: node scripts/reset-partner-password.js <email> <newPassword>");
	process.exit(1);
}

if (newPassword.length < 6) {
	console.error("Password must be at least 6 characters.");
	process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/plindo-admin");
console.log("Connected to MongoDB");

const partner = await Partner.findOne({ email: email.toLowerCase() });
if (!partner) {
	console.error(`No partner found with email: ${email}`);
	await mongoose.disconnect();
	process.exit(1);
}

console.log(`Found partner: ${partner.businessName} (${partner.email}) — status: ${partner.status}`);
console.log(`Drivers stored: ${partner.drivers?.length ?? 0}`);
if (partner.drivers?.length) {
	partner.drivers.forEach((d, i) => {
		console.log(`  Driver ${i + 1}: ${d.fullName} | ${d.contactNumber} | license: ${d.driverLicenseUrl || "none"} | insurance: ${d.driverInsuranceUrl || "none"}`);
	});
}
console.log(`Logo: ${partner.logo || "none"}`);
console.log(`Cover photo: ${partner.coverPhoto || "none"}`);
console.log(`Description: ${partner.description || "none"}`);
console.log(`Work photos: ${partner.workPhotos?.length ?? 0}`);

// Reset password — triggers the pre-save bcrypt hook
partner.password = newPassword;
await partner.save();

console.log(`\nPassword updated successfully for ${partner.email}`);
await mongoose.disconnect();
