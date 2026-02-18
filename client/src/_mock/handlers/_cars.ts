import { faker } from "@faker-js/faker";
import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

// Types
export interface Car {
	id: string;
	make: string;
	model: string;
	bodyType: string;
	createdAt: string;
	updatedAt: string;
}

export interface CarMake {
	id: string;
	name: string;
	models: CarModel[];
}

export interface CarModel {
	id: string;
	name: string;
	bodyType: string;
}

// Body types
export const CAR_BODY_TYPES = [
	"Hatchback",
	"Sedan",
	"SUV",
	"Coupe",
	"Convertible",
	"Van",
	"Pickup Truck",
	"MPV/Minivan",
	"Station Wagon",
	"Crossover",
];

// In-memory cars store
const carsStore = new Map<string, Car>();

// Generate initial mock cars
const generateMockCars = () => {
	const mockCars: Car[] = [
		// Toyota
		{ id: faker.string.uuid(), make: "Toyota", model: "Corolla", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Toyota", model: "Camry", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Toyota", model: "RAV4", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Toyota", model: "Yaris", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Toyota", model: "Highlander", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Toyota", model: "Sienna", bodyType: "MPV/Minivan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Honda
		{ id: faker.string.uuid(), make: "Honda", model: "Civic", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Honda", model: "Accord", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Honda", model: "CR-V", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Honda", model: "HR-V", bodyType: "Crossover", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Honda", model: "Fit", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// BMW
		{ id: faker.string.uuid(), make: "BMW", model: "3 Series", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "BMW", model: "5 Series", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "BMW", model: "X3", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "BMW", model: "X5", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "BMW", model: "4 Series", bodyType: "Coupe", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Mercedes-Benz
		{ id: faker.string.uuid(), make: "Mercedes-Benz", model: "C-Class", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Mercedes-Benz", model: "E-Class", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Mercedes-Benz", model: "GLC", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Mercedes-Benz", model: "GLE", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Mercedes-Benz", model: "A-Class", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Audi
		{ id: faker.string.uuid(), make: "Audi", model: "A3", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Audi", model: "A4", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Audi", model: "Q5", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Audi", model: "Q7", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Audi", model: "TT", bodyType: "Coupe", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Ford
		{ id: faker.string.uuid(), make: "Ford", model: "Focus", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Ford", model: "Mustang", bodyType: "Coupe", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Ford", model: "Explorer", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Ford", model: "F-150", bodyType: "Pickup Truck", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Ford", model: "Transit", bodyType: "Van", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Volkswagen
		{ id: faker.string.uuid(), make: "Volkswagen", model: "Golf", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Volkswagen", model: "Passat", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Volkswagen", model: "Tiguan", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Volkswagen", model: "Polo", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Volkswagen", model: "Transporter", bodyType: "Van", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Nissan
		{ id: faker.string.uuid(), make: "Nissan", model: "Altima", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Nissan", model: "Rogue", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Nissan", model: "Sentra", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Nissan", model: "Qashqai", bodyType: "Crossover", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Hyundai
		{ id: faker.string.uuid(), make: "Hyundai", model: "Elantra", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Hyundai", model: "Tucson", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Hyundai", model: "Santa Fe", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Hyundai", model: "i20", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Kia
		{ id: faker.string.uuid(), make: "Kia", model: "Sportage", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Kia", model: "Sorento", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Kia", model: "Ceed", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Kia", model: "Rio", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Mazda
		{ id: faker.string.uuid(), make: "Mazda", model: "Mazda3", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Mazda", model: "Mazda6", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Mazda", model: "CX-5", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Mazda", model: "MX-5", bodyType: "Convertible", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Peugeot
		{ id: faker.string.uuid(), make: "Peugeot", model: "208", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Peugeot", model: "308", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Peugeot", model: "3008", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Peugeot", model: "5008", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Renault
		{ id: faker.string.uuid(), make: "Renault", model: "Clio", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Renault", model: "Megane", bodyType: "Hatchback", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Renault", model: "Captur", bodyType: "Crossover", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Renault", model: "Kadjar", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Volvo
		{ id: faker.string.uuid(), make: "Volvo", model: "XC40", bodyType: "Crossover", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Volvo", model: "XC60", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Volvo", model: "XC90", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Volvo", model: "S60", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Volvo", model: "V60", bodyType: "Station Wagon", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Land Rover
		{ id: faker.string.uuid(), make: "Land Rover", model: "Range Rover", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Land Rover", model: "Range Rover Sport", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Land Rover", model: "Discovery", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Land Rover", model: "Defender", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Porsche
		{ id: faker.string.uuid(), make: "Porsche", model: "911", bodyType: "Coupe", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Porsche", model: "Cayenne", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Porsche", model: "Macan", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Porsche", model: "Panamera", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		// Tesla
		{ id: faker.string.uuid(), make: "Tesla", model: "Model 3", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Tesla", model: "Model Y", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Tesla", model: "Model S", bodyType: "Sedan", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
		{ id: faker.string.uuid(), make: "Tesla", model: "Model X", bodyType: "SUV", createdAt: faker.date.past().toISOString(), updatedAt: faker.date.recent().toISOString() },
	];

	mockCars.forEach((car) => {
		carsStore.set(car.id, car);
	});

	return mockCars;
};

// Initialize with mock cars
generateMockCars();

// API Handlers
const getCars = http.get("/api/admin/cars", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const make = url.searchParams.get("make");
	const model = url.searchParams.get("model");
	const bodyType = url.searchParams.get("bodyType");
	const search = url.searchParams.get("search");

	let cars = Array.from(carsStore.values());

	// Apply filters
	if (make) {
		cars = cars.filter((car) => car.make === make);
	}
	if (model) {
		cars = cars.filter((car) => car.model === model);
	}
	if (bodyType) {
		cars = cars.filter((car) => car.bodyType === bodyType);
	}
	if (search) {
		const searchLower = search.toLowerCase();
		cars = cars.filter(
			(car) =>
				car.make.toLowerCase().includes(searchLower) ||
				car.model.toLowerCase().includes(searchLower) ||
				car.bodyType.toLowerCase().includes(searchLower)
		);
	}

	// Sort by make, then model
	cars.sort((a, b) => {
		if (a.make !== b.make) return a.make.localeCompare(b.make);
		return a.model.localeCompare(b.model);
	});

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { cars },
	});
});

const getCarById = http.get("/api/admin/cars/:id", async ({ params }) => {
	await delay(200);

	const { id } = params;
	const car = carsStore.get(id as string);

	if (!car) {
		return HttpResponse.json(
			{
				status: 10001,
				message: "Car not found",
			},
			{ status: 404 }
		);
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { car },
	});
});

const createCar = http.post("/api/admin/cars", async ({ request }) => {
	await delay(500);

	const body = (await request.json()) as Omit<Car, "id" | "createdAt" | "updatedAt">;

	// Check if car already exists
	const existingCar = Array.from(carsStore.values()).find(
		(car) => car.make === body.make && car.model === body.model
	);

	if (existingCar) {
		return HttpResponse.json(
			{
				status: 10002,
				message: "A car with this make and model already exists",
			},
			{ status: 400 }
		);
	}

	const newCar: Car = {
		...body,
		id: faker.string.uuid(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	carsStore.set(newCar.id, newCar);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Car created successfully",
		data: { car: newCar },
	});
});

const updateCar = http.put("/api/admin/cars/:id", async ({ params, request }) => {
	await delay(500);

	const { id } = params;
	const existingCar = carsStore.get(id as string);

	if (!existingCar) {
		return HttpResponse.json(
			{
				status: 10001,
				message: "Car not found",
			},
			{ status: 404 }
		);
	}

	const updates = (await request.json()) as Partial<Car>;
	const updatedCar: Car = {
		...existingCar,
		...updates,
		id: existingCar.id,
		createdAt: existingCar.createdAt,
		updatedAt: new Date().toISOString(),
	};

	carsStore.set(id as string, updatedCar);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Car updated successfully",
		data: { car: updatedCar },
	});
});

const deleteCar = http.delete("/api/admin/cars/:id", async ({ params }) => {
	await delay(300);

	const { id } = params;
	const car = carsStore.get(id as string);

	if (!car) {
		return HttpResponse.json(
			{
				status: 10001,
				message: "Car not found",
			},
			{ status: 404 }
		);
	}

	carsStore.delete(id as string);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Car deleted successfully",
	});
});

// Get all unique makes
const getCarMakes = http.get("/api/admin/cars/makes", async () => {
	await delay(100);

	const cars = Array.from(carsStore.values());
	const makes = [...new Set(cars.map((car) => car.make))].sort();

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { makes },
	});
});

// Get models for a specific make
const getCarModels = http.get("/api/admin/cars/models/:make", async ({ params }) => {
	await delay(100);

	const { make } = params;
	const cars = Array.from(carsStore.values()).filter((car) => car.make === make);
	const models = [...new Set(cars.map((car) => car.model))].sort();

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { models },
	});
});

// Get body types
const getBodyTypes = http.get("/api/admin/cars/body-types", async () => {
	await delay(100);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { bodyTypes: CAR_BODY_TYPES },
	});
});

// Get cars grouped by make for partner service pricing
const getCarsGroupedByMake = http.get("/api/admin/cars/grouped", async () => {
	await delay(200);

	const cars = Array.from(carsStore.values());
	const grouped: Record<string, Car[]> = {};

	cars.forEach((car) => {
		if (!grouped[car.make]) {
			grouped[car.make] = [];
		}
		grouped[car.make].push(car);
	});

	// Sort models within each make
	Object.keys(grouped).forEach((make) => {
		grouped[make].sort((a, b) => a.model.localeCompare(b.model));
	});

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { carsGrouped: grouped },
	});
});

export const carsHandlers = [
	getCars,
	getCarById,
	createCar,
	updateCar,
	deleteCar,
	getCarMakes,
	getCarModels,
	getBodyTypes,
	getCarsGroupedByMake,
];
