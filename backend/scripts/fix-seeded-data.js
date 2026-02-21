/**
 * One-time migration script: fix seeded data inconsistencies.
 *
 * What it does:
 * 1. Finds all bookings whose partnerId doesn't exist in the Partner collection
 *    but whose partnerBusinessName matches a real partner, and updates the partnerId.
 * 2. Zeros out fake seeded stats (rating, totalBookings, completionRate, totalEarnings)
 *    on all Partner documents so the backend aggregates real values.
 *
 * Usage:
 *   node --experimental-vm-modules backend/scripts/fix-seeded-data.js
 * Or from the backend directory:
 *   node scripts/fix-seeded-data.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/plindo";

await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB:", MONGO_URI);

const db = mongoose.connection.db;
const partners = db.collection("partners");
const bookings = db.collection("bookings");

// Step 1: Zero out fake seeded stats on all Partner documents.
// The real stats are computed on-the-fly from the Booking collection.
const zeroStatsResult = await partners.updateMany(
  {},
  {
    $set: {
      rating: null,
      totalBookings: 0,
      completionRate: null,
      totalEarnings: 0,
    },
  }
);
console.log(`Zeroed seeded stats on ${zeroStatsResult.modifiedCount} partner(s).`);

// Step 2: Find all real partners (id -> businessName mapping)
const allPartners = await partners.find({}, { projection: { _id: 1, businessName: 1 } }).toArray();
const businessNameToId = {};
for (const p of allPartners) {
  businessNameToId[p.businessName] = p._id;
}
console.log("Real partners found:", allPartners.map(p => `${p.businessName} (${p._id})`));

// Step 3: Find all distinct partnerIds referenced in bookings
const bookingPartnerIds = await bookings.distinct("partnerId");
console.log("PartnerIds referenced in bookings:", bookingPartnerIds);

// Step 4: For each bookingPartnerId, check if it exists in partners collection
let fixedCount = 0;
for (const pid of bookingPartnerIds) {
  const exists = await partners.findOne({ _id: pid });
  if (!exists) {
    // This partnerId is orphaned - find bookings with this pid and fix them
    const orphanedBookings = await bookings.find({ partnerId: pid }).toArray();
    for (const booking of orphanedBookings) {
      const realPartnerId = businessNameToId[booking.partnerBusinessName];
      if (realPartnerId) {
        await bookings.updateOne(
          { _id: booking._id },
          { $set: { partnerId: realPartnerId } }
        );
        console.log(
          `Fixed booking ${booking.bookingNumber}: partnerId ${pid} → ${realPartnerId} (${booking.partnerBusinessName})`
        );
        fixedCount++;
      } else {
        console.warn(
          `No real partner found for booking ${booking.bookingNumber} with partnerBusinessName "${booking.partnerBusinessName}"`
        );
      }
    }
  }
}

console.log(`\nMigration complete. Fixed ${fixedCount} orphaned booking(s).`);
await mongoose.disconnect();
