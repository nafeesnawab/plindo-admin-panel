import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Import models
import Partner from "../src/models/Partner.model.js";
import Driver from "../src/models/Driver.model.js";

const migrateDrivers = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("Connected to MongoDB");

		// Find all approved partners with embedded drivers
		const partners = await Partner.find({
			status: { $in: ["active", "approved"] },
			"drivers.0": { $exists: true },
		});

		console.log(`Found ${partners.length} partners with drivers to migrate`);

		for (const partner of partners) {
			console.log(`\nMigrating drivers for partner: ${partner.businessName}`);

			// Check if drivers already migrated
			const existingDrivers = await Driver.find({ partnerId: partner._id });
			if (existingDrivers.length > 0) {
				console.log(`  - Skipped: ${existingDrivers.length} drivers already exist`);
				continue;
			}

			// Migrate drivers
			const driversToCreate = partner.drivers.map((d) => ({
				partnerId: partner._id,
				fullName: d.fullName,
				phone: d.contactNumber,
				licenseUrl: d.driverLicenseUrl,
				insuranceUrl: d.driverInsuranceUrl,
				status: "active",
			}));

			const created = await Driver.insertMany(driversToCreate);
			console.log(`  ✓ Migrated ${created.length} drivers`);
		}

		console.log("\n✓ Driver migration completed successfully");
		process.exit(0);
	} catch (err) {
		console.error("Migration failed:", err);
		process.exit(1);
	}
};

migrateDrivers();
