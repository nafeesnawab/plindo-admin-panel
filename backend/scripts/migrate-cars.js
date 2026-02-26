/**
 * migrate-cars.js
 * 1. Drops the old (make, model) unique index if still present
 * 2. Bulk-inserts a comprehensive UK car registry (skips duplicates)
 *
 * Run: node backend/scripts/migrate-cars.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Car from "../src/models/Car.model.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const CARS = [
	// Toyota
	{ make: "Toyota", model: "Aygo", bodyType: "Hatchback" },
	{ make: "Toyota", model: "Yaris", bodyType: "Hatchback" },
	{ make: "Toyota", model: "Auris", bodyType: "Hatchback" },
	{ make: "Toyota", model: "Corolla", bodyType: "Hatchback" },
	{ make: "Toyota", model: "Corolla", bodyType: "Sedan" },
	{ make: "Toyota", model: "Corolla", bodyType: "Station Wagon" },
	{ make: "Toyota", model: "Camry", bodyType: "Sedan" },
	{ make: "Toyota", model: "Prius", bodyType: "Hatchback" },
	{ make: "Toyota", model: "C-HR", bodyType: "Crossover" },
	{ make: "Toyota", model: "RAV4", bodyType: "SUV" },
	{ make: "Toyota", model: "Land Cruiser", bodyType: "SUV" },
	{ make: "Toyota", model: "Hilux", bodyType: "Pickup Truck" },
	{ make: "Toyota", model: "Proace", bodyType: "Van" },
	// Honda
	{ make: "Honda", model: "Jazz", bodyType: "Hatchback" },
	{ make: "Honda", model: "Civic", bodyType: "Hatchback" },
	{ make: "Honda", model: "Civic", bodyType: "Sedan" },
	{ make: "Honda", model: "Accord", bodyType: "Sedan" },
	{ make: "Honda", model: "HR-V", bodyType: "Crossover" },
	{ make: "Honda", model: "CR-V", bodyType: "SUV" },
	// BMW
	{ make: "BMW", model: "1 Series", bodyType: "Hatchback" },
	{ make: "BMW", model: "2 Series", bodyType: "Coupe" },
	{ make: "BMW", model: "2 Series", bodyType: "Convertible" },
	{ make: "BMW", model: "3 Series", bodyType: "Sedan" },
	{ make: "BMW", model: "3 Series", bodyType: "Station Wagon" },
	{ make: "BMW", model: "4 Series", bodyType: "Coupe" },
	{ make: "BMW", model: "4 Series", bodyType: "Convertible" },
	{ make: "BMW", model: "5 Series", bodyType: "Sedan" },
	{ make: "BMW", model: "5 Series", bodyType: "Station Wagon" },
	{ make: "BMW", model: "7 Series", bodyType: "Sedan" },
	{ make: "BMW", model: "X1", bodyType: "SUV" },
	{ make: "BMW", model: "X2", bodyType: "Crossover" },
	{ make: "BMW", model: "X3", bodyType: "SUV" },
	{ make: "BMW", model: "X5", bodyType: "SUV" },
	{ make: "BMW", model: "X7", bodyType: "SUV" },
	// Mercedes-Benz
	{ make: "Mercedes-Benz", model: "A-Class", bodyType: "Hatchback" },
	{ make: "Mercedes-Benz", model: "B-Class", bodyType: "MPV/Minivan" },
	{ make: "Mercedes-Benz", model: "C-Class", bodyType: "Sedan" },
	{ make: "Mercedes-Benz", model: "C-Class", bodyType: "Station Wagon" },
	{ make: "Mercedes-Benz", model: "C-Class", bodyType: "Coupe" },
	{ make: "Mercedes-Benz", model: "E-Class", bodyType: "Sedan" },
	{ make: "Mercedes-Benz", model: "E-Class", bodyType: "Station Wagon" },
	{ make: "Mercedes-Benz", model: "S-Class", bodyType: "Sedan" },
	{ make: "Mercedes-Benz", model: "GLA", bodyType: "Crossover" },
	{ make: "Mercedes-Benz", model: "GLC", bodyType: "SUV" },
	{ make: "Mercedes-Benz", model: "GLE", bodyType: "SUV" },
	{ make: "Mercedes-Benz", model: "GLS", bodyType: "SUV" },
	// Volkswagen
	{ make: "Volkswagen", model: "Polo", bodyType: "Hatchback" },
	{ make: "Volkswagen", model: "Golf", bodyType: "Hatchback" },
	{ make: "Volkswagen", model: "Golf", bodyType: "Station Wagon" },
	{ make: "Volkswagen", model: "Passat", bodyType: "Sedan" },
	{ make: "Volkswagen", model: "Passat", bodyType: "Station Wagon" },
	{ make: "Volkswagen", model: "T-Cross", bodyType: "Crossover" },
	{ make: "Volkswagen", model: "T-Roc", bodyType: "Crossover" },
	{ make: "Volkswagen", model: "Tiguan", bodyType: "SUV" },
	{ make: "Volkswagen", model: "Touareg", bodyType: "SUV" },
	{ make: "Volkswagen", model: "Sharan", bodyType: "MPV/Minivan" },
	{ make: "Volkswagen", model: "Transporter", bodyType: "Van" },
	{ make: "Volkswagen", model: "Caddy", bodyType: "Van" },
	// Audi
	{ make: "Audi", model: "A1", bodyType: "Hatchback" },
	{ make: "Audi", model: "A3", bodyType: "Hatchback" },
	{ make: "Audi", model: "A3", bodyType: "Sedan" },
	{ make: "Audi", model: "A4", bodyType: "Sedan" },
	{ make: "Audi", model: "A4", bodyType: "Station Wagon" },
	{ make: "Audi", model: "A5", bodyType: "Coupe" },
	{ make: "Audi", model: "A6", bodyType: "Sedan" },
	{ make: "Audi", model: "A6", bodyType: "Station Wagon" },
	{ make: "Audi", model: "A7", bodyType: "Coupe" },
	{ make: "Audi", model: "A8", bodyType: "Sedan" },
	{ make: "Audi", model: "Q2", bodyType: "Crossover" },
	{ make: "Audi", model: "Q3", bodyType: "Crossover" },
	{ make: "Audi", model: "Q5", bodyType: "SUV" },
	{ make: "Audi", model: "Q7", bodyType: "SUV" },
	{ make: "Audi", model: "Q8", bodyType: "SUV" },
	// Ford
	{ make: "Ford", model: "Fiesta", bodyType: "Hatchback" },
	{ make: "Ford", model: "Focus", bodyType: "Hatchback" },
	{ make: "Ford", model: "Focus", bodyType: "Sedan" },
	{ make: "Ford", model: "Focus", bodyType: "Station Wagon" },
	{ make: "Ford", model: "Puma", bodyType: "Crossover" },
	{ make: "Ford", model: "Kuga", bodyType: "SUV" },
	{ make: "Ford", model: "Mustang", bodyType: "Coupe" },
	{ make: "Ford", model: "Mustang", bodyType: "Convertible" },
	{ make: "Ford", model: "Ranger", bodyType: "Pickup Truck" },
	{ make: "Ford", model: "Galaxy", bodyType: "MPV/Minivan" },
	{ make: "Ford", model: "Transit", bodyType: "Van" },
	{ make: "Ford", model: "Transit Custom", bodyType: "Van" },
	// Nissan
	{ make: "Nissan", model: "Micra", bodyType: "Hatchback" },
	{ make: "Nissan", model: "Juke", bodyType: "Crossover" },
	{ make: "Nissan", model: "Qashqai", bodyType: "Crossover" },
	{ make: "Nissan", model: "X-Trail", bodyType: "SUV" },
	{ make: "Nissan", model: "Leaf", bodyType: "Hatchback" },
	{ make: "Nissan", model: "Navara", bodyType: "Pickup Truck" },
	// Vauxhall
	{ make: "Vauxhall", model: "Corsa", bodyType: "Hatchback" },
	{ make: "Vauxhall", model: "Astra", bodyType: "Hatchback" },
	{ make: "Vauxhall", model: "Astra", bodyType: "Station Wagon" },
	{ make: "Vauxhall", model: "Insignia", bodyType: "Sedan" },
	{ make: "Vauxhall", model: "Insignia", bodyType: "Station Wagon" },
	{ make: "Vauxhall", model: "Mokka", bodyType: "Crossover" },
	{ make: "Vauxhall", model: "Grandland", bodyType: "SUV" },
	{ make: "Vauxhall", model: "Combo", bodyType: "Van" },
	{ make: "Vauxhall", model: "Vivaro", bodyType: "Van" },
	// Peugeot
	{ make: "Peugeot", model: "208", bodyType: "Hatchback" },
	{ make: "Peugeot", model: "308", bodyType: "Hatchback" },
	{ make: "Peugeot", model: "508", bodyType: "Sedan" },
	{ make: "Peugeot", model: "2008", bodyType: "Crossover" },
	{ make: "Peugeot", model: "3008", bodyType: "SUV" },
	{ make: "Peugeot", model: "5008", bodyType: "SUV" },
	{ make: "Peugeot", model: "Partner", bodyType: "Van" },
	{ make: "Peugeot", model: "Expert", bodyType: "Van" },
	// Renault
	{ make: "Renault", model: "Clio", bodyType: "Hatchback" },
	{ make: "Renault", model: "Megane", bodyType: "Hatchback" },
	{ make: "Renault", model: "Megane", bodyType: "Station Wagon" },
	{ make: "Renault", model: "Captur", bodyType: "Crossover" },
	{ make: "Renault", model: "Kadjar", bodyType: "SUV" },
	{ make: "Renault", model: "Koleos", bodyType: "SUV" },
	{ make: "Renault", model: "Zoe", bodyType: "Hatchback" },
	// Hyundai
	{ make: "Hyundai", model: "i10", bodyType: "Hatchback" },
	{ make: "Hyundai", model: "i20", bodyType: "Hatchback" },
	{ make: "Hyundai", model: "i30", bodyType: "Hatchback" },
	{ make: "Hyundai", model: "Kona", bodyType: "Crossover" },
	{ make: "Hyundai", model: "Tucson", bodyType: "SUV" },
	{ make: "Hyundai", model: "Santa Fe", bodyType: "SUV" },
	{ make: "Hyundai", model: "Ioniq", bodyType: "Hatchback" },
	// Kia
	{ make: "Kia", model: "Picanto", bodyType: "Hatchback" },
	{ make: "Kia", model: "Rio", bodyType: "Hatchback" },
	{ make: "Kia", model: "Ceed", bodyType: "Hatchback" },
	{ make: "Kia", model: "Ceed", bodyType: "Station Wagon" },
	{ make: "Kia", model: "Niro", bodyType: "Crossover" },
	{ make: "Kia", model: "Sportage", bodyType: "SUV" },
	{ make: "Kia", model: "Sorento", bodyType: "SUV" },
	{ make: "Kia", model: "Stinger", bodyType: "Sedan" },
	// Land Rover
	{ make: "Land Rover", model: "Defender", bodyType: "SUV" },
	{ make: "Land Rover", model: "Discovery", bodyType: "SUV" },
	{ make: "Land Rover", model: "Discovery Sport", bodyType: "SUV" },
	{ make: "Land Rover", model: "Freelander", bodyType: "SUV" },
	// Range Rover
	{ make: "Range Rover", model: "Range Rover", bodyType: "SUV" },
	{ make: "Range Rover", model: "Sport", bodyType: "SUV" },
	{ make: "Range Rover", model: "Evoque", bodyType: "SUV" },
	{ make: "Range Rover", model: "Velar", bodyType: "SUV" },
	// Mazda
	{ make: "Mazda", model: "2", bodyType: "Hatchback" },
	{ make: "Mazda", model: "3", bodyType: "Hatchback" },
	{ make: "Mazda", model: "3", bodyType: "Sedan" },
	{ make: "Mazda", model: "6", bodyType: "Sedan" },
	{ make: "Mazda", model: "6", bodyType: "Station Wagon" },
	{ make: "Mazda", model: "CX-3", bodyType: "Crossover" },
	{ make: "Mazda", model: "CX-30", bodyType: "Crossover" },
	{ make: "Mazda", model: "CX-5", bodyType: "SUV" },
	// Volvo
	{ make: "Volvo", model: "V40", bodyType: "Hatchback" },
	{ make: "Volvo", model: "V60", bodyType: "Station Wagon" },
	{ make: "Volvo", model: "V90", bodyType: "Station Wagon" },
	{ make: "Volvo", model: "S60", bodyType: "Sedan" },
	{ make: "Volvo", model: "S90", bodyType: "Sedan" },
	{ make: "Volvo", model: "XC40", bodyType: "SUV" },
	{ make: "Volvo", model: "XC60", bodyType: "SUV" },
	{ make: "Volvo", model: "XC90", bodyType: "SUV" },
	// Tesla
	{ make: "Tesla", model: "Model 3", bodyType: "Sedan" },
	{ make: "Tesla", model: "Model S", bodyType: "Sedan" },
	{ make: "Tesla", model: "Model X", bodyType: "SUV" },
	{ make: "Tesla", model: "Model Y", bodyType: "SUV" },
	// Porsche
	{ make: "Porsche", model: "911", bodyType: "Coupe" },
	{ make: "Porsche", model: "911", bodyType: "Convertible" },
	{ make: "Porsche", model: "Cayenne", bodyType: "SUV" },
	{ make: "Porsche", model: "Macan", bodyType: "SUV" },
	{ make: "Porsche", model: "Panamera", bodyType: "Sedan" },
	{ make: "Porsche", model: "Taycan", bodyType: "Sedan" },
	// SEAT
	{ make: "SEAT", model: "Ibiza", bodyType: "Hatchback" },
	{ make: "SEAT", model: "Leon", bodyType: "Hatchback" },
	{ make: "SEAT", model: "Leon", bodyType: "Station Wagon" },
	{ make: "SEAT", model: "Arona", bodyType: "Crossover" },
	{ make: "SEAT", model: "Ateca", bodyType: "SUV" },
	// Skoda
	{ make: "Skoda", model: "Fabia", bodyType: "Hatchback" },
	{ make: "Skoda", model: "Octavia", bodyType: "Hatchback" },
	{ make: "Skoda", model: "Octavia", bodyType: "Station Wagon" },
	{ make: "Skoda", model: "Superb", bodyType: "Sedan" },
	{ make: "Skoda", model: "Superb", bodyType: "Station Wagon" },
	{ make: "Skoda", model: "Kamiq", bodyType: "Crossover" },
	{ make: "Skoda", model: "Karoq", bodyType: "SUV" },
	{ make: "Skoda", model: "Kodiaq", bodyType: "SUV" },
	// Mini
	{ make: "Mini", model: "Hatch", bodyType: "Hatchback" },
	{ make: "Mini", model: "Convertible", bodyType: "Convertible" },
	{ make: "Mini", model: "Clubman", bodyType: "Station Wagon" },
	{ make: "Mini", model: "Countryman", bodyType: "Crossover" },
	{ make: "Mini", model: "Paceman", bodyType: "Crossover" },
	// Jaguar
	{ make: "Jaguar", model: "XE", bodyType: "Sedan" },
	{ make: "Jaguar", model: "XF", bodyType: "Sedan" },
	{ make: "Jaguar", model: "XF", bodyType: "Station Wagon" },
	{ make: "Jaguar", model: "F-Type", bodyType: "Coupe" },
	{ make: "Jaguar", model: "F-Type", bodyType: "Convertible" },
	{ make: "Jaguar", model: "E-Pace", bodyType: "SUV" },
	{ make: "Jaguar", model: "F-Pace", bodyType: "SUV" },
	{ make: "Jaguar", model: "I-Pace", bodyType: "SUV" },
	// Lexus
	{ make: "Lexus", model: "IS", bodyType: "Sedan" },
	{ make: "Lexus", model: "ES", bodyType: "Sedan" },
	{ make: "Lexus", model: "LS", bodyType: "Sedan" },
	{ make: "Lexus", model: "UX", bodyType: "Crossover" },
	{ make: "Lexus", model: "NX", bodyType: "Crossover" },
	{ make: "Lexus", model: "RX", bodyType: "SUV" },
	{ make: "Lexus", model: "LX", bodyType: "SUV" },
	// Jeep
	{ make: "Jeep", model: "Renegade", bodyType: "Crossover" },
	{ make: "Jeep", model: "Compass", bodyType: "SUV" },
	{ make: "Jeep", model: "Cherokee", bodyType: "SUV" },
	{ make: "Jeep", model: "Grand Cherokee", bodyType: "SUV" },
	{ make: "Jeep", model: "Wrangler", bodyType: "SUV" },
	// Fiat
	{ make: "Fiat", model: "500", bodyType: "Hatchback" },
	{ make: "Fiat", model: "500C", bodyType: "Convertible" },
	{ make: "Fiat", model: "Panda", bodyType: "Hatchback" },
	{ make: "Fiat", model: "Tipo", bodyType: "Hatchback" },
	{ make: "Fiat", model: "Tipo", bodyType: "Sedan" },
	{ make: "Fiat", model: "Ducato", bodyType: "Van" },
];

async function run() {
	await mongoose.connect(process.env.MONGODB_URI);
	console.log("Connected to MongoDB");

	// Drop the old (make, model) unique index if it still exists
	try {
		await Car.collection.dropIndex("make_1_model_1");
		console.log("Dropped old (make, model) unique index");
	} catch {
		console.log("Old (make, model) index not found — skipping");
	}

	// Insert new cars, skip duplicates
	let added = 0;
	let skipped = 0;
	for (const car of CARS) {
		const exists = await Car.findOne({ make: car.make, model: car.model, bodyType: car.bodyType });
		if (!exists) {
			await Car.create(car);
			added++;
		} else {
			skipped++;
		}
	}

	console.log(`Done: ${added} added, ${skipped} already existed`);
	await mongoose.disconnect();
}

run().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
