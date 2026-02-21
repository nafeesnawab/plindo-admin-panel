import Car from "../models/Car.model.js";
import { error, success } from "../utils/response.js";

/**
 * GET /api/admin/cars
 */
export const getCars = async (req, res) => {
	try {
		const filter = {};
		if (req.query.make) filter.make = req.query.make;
		if (req.query.model) filter.model = req.query.model;
		if (req.query.bodyType) filter.bodyType = req.query.bodyType;
		if (req.query.search) {
			filter.$or = [
				{ make: { $regex: req.query.search, $options: "i" } },
				{ model: { $regex: req.query.search, $options: "i" } },
				{ bodyType: { $regex: req.query.search, $options: "i" } },
			];
		}

		const cars = await Car.find(filter).sort({ make: 1, model: 1 });
		return success(res, { cars });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/admin/cars
 */
export const createCar = async (req, res) => {
	try {
		const { make, model, bodyType } = req.body;
		const existing = await Car.findOne({ make, model });
		if (existing) return error(res, "A car with this make and model already exists", 400, 10002);

		const car = await Car.create({ make, model, bodyType });
		return success(res, { car }, "Car created successfully", 201);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/admin/cars/makes
 */
export const getMakes = async (req, res) => {
	try {
		const makes = await Car.distinct("make");
		return success(res, { makes: makes.sort() });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/admin/cars/body-types
 */
export const getBodyTypes = async (req, res) => {
	try {
		const bodyTypes = await Car.distinct("bodyType");
		return success(res, { bodyTypes: bodyTypes.sort() });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/admin/cars/grouped
 */
export const getGrouped = async (req, res) => {
	try {
		const cars = await Car.find().sort({ make: 1, model: 1 });
		const grouped = {};
		cars.forEach((car) => {
			if (!grouped[car.make]) grouped[car.make] = [];
			grouped[car.make].push(car);
		});
		return success(res, { carsGrouped: grouped });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/admin/cars/models/:make
 */
export const getModelsByMake = async (req, res) => {
	try {
		const models = await Car.distinct("model", { make: req.params.make });
		return success(res, { models: models.sort() });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/admin/cars/:id
 */
export const getCarById = async (req, res) => {
	try {
		const car = await Car.findById(req.params.id);
		if (!car) return error(res, "Car not found", 404, 10001);
		return success(res, { car });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/admin/cars/:id
 */
export const updateCar = async (req, res) => {
	try {
		const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!car) return error(res, "Car not found", 404, 10001);
		return success(res, { car }, "Car updated successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/admin/cars/:id
 */
export const deleteCar = async (req, res) => {
	try {
		const car = await Car.findByIdAndDelete(req.params.id);
		if (!car) return error(res, "Car not found", 404, 10001);
		return success(res, {}, "Car deleted successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
