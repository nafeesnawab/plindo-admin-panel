import { ResultStatus } from "@/types/enum";
import { ProductCategory, ProductStatus, type Product } from "@/types/product";
import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const productCategories = Object.values(ProductCategory);

const productNames: Record<ProductCategory, string[]> = {
	[ProductCategory.OilFluids]: [
		"Premium Engine Oil 5W-30",
		"Synthetic Motor Oil 10W-40",
		"Brake Fluid DOT 4",
		"Power Steering Fluid",
		"Coolant Antifreeze",
		"Transmission Fluid ATF",
	],
	[ProductCategory.TiresWheels]: [
		"All-Season Tire 205/55R16",
		"Winter Tire 195/65R15",
		"Alloy Wheel 17 inch",
		"Steel Wheel 16 inch",
		"Tire Pressure Gauge",
		"Wheel Balancing Weights",
	],
	[ProductCategory.Cleaning]: [
		"Car Wash Shampoo 1L",
		"Glass Cleaner Spray",
		"Interior Detailing Spray",
		"Tire Shine Gel",
		"Microfiber Cleaning Cloth Set",
		"Leather Conditioner",
	],
	[ProductCategory.Accessories]: [
		"Car Phone Holder",
		"USB Car Charger",
		"Air Freshener",
		"Floor Mat Set",
		"Sunshade Windshield Cover",
		"Steering Wheel Cover",
	],
	[ProductCategory.Parts]: [
		"Wiper Blade Set",
		"Air Filter",
		"Cabin Air Filter",
		"Spark Plugs Set",
		"Brake Pads Front",
		"Headlight Bulb H7",
	],
	[ProductCategory.Other]: [
		"Emergency Kit",
		"Jump Starter Cable",
		"Tire Repair Kit",
		"First Aid Kit",
		"Warning Triangle",
		"Reflective Vest",
	],
};

const productsStore = new Map<string, Product[]>();

const generateProduct = (partnerId: string, category?: ProductCategory): Product => {
	const selectedCategory = category || faker.helpers.arrayElement(productCategories);
	const stock = faker.number.int({ min: 0, max: 100 });
	let status: ProductStatus;

	if (stock === 0) {
		status = ProductStatus.OutOfStock;
	} else if (faker.datatype.boolean(0.1)) {
		status = ProductStatus.Unavailable;
	} else {
		status = ProductStatus.Available;
	}

	return {
		id: faker.string.uuid(),
		partnerId,
		name: faker.helpers.arrayElement(productNames[selectedCategory]),
		description: faker.datatype.boolean(0.7) ? faker.commerce.productDescription().slice(0, 200) : undefined,
		category: selectedCategory,
		price: Number.parseFloat(faker.commerce.price({ min: 5, max: 200, dec: 2 })),
		stock,
		imageUrl: `/placeholder-product-${faker.number.int({ min: 1, max: 10 })}.jpg`,
		status,
		createdAt: faker.date.past({ years: 1 }).toISOString(),
		updatedAt: faker.date.recent({ days: 30 }).toISOString(),
	};
};

const getOrCreateProducts = (partnerId: string): Product[] => {
	if (!productsStore.has(partnerId)) {
		const products = Array.from({ length: faker.number.int({ min: 15, max: 30 }) }, () =>
			generateProduct(partnerId)
		);
		productsStore.set(partnerId, products);
	}
	return productsStore.get(partnerId)!;
};

export const getProducts = http.get("/api/partner/products", async ({ request }) => {
	await delay(300);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const page = Number.parseInt(url.searchParams.get("page") || "1");
	const limit = Number.parseInt(url.searchParams.get("limit") || "10");
	const search = url.searchParams.get("search") || "";
	const statusFilter = url.searchParams.get("status") || "";
	const categoryFilter = url.searchParams.get("category") || "";

	let products = getOrCreateProducts(partnerId);

	if (search) {
		products = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
	}

	if (statusFilter && statusFilter !== "all") {
		products = products.filter((p) => p.status === statusFilter);
	}

	if (categoryFilter && categoryFilter !== "all") {
		products = products.filter((p) => p.category === categoryFilter);
	}

	const total = products.length;
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;
	const items = products.slice(startIndex, endIndex);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			items,
			total,
			page,
			limit,
		},
	});
});

export const getProductDetails = http.get("/api/partner/products/:id", async ({ params }) => {
	await delay(200);
	const { id } = params;

	for (const products of productsStore.values()) {
		const product = products.find((p) => p.id === id);
		if (product) {
			return HttpResponse.json({
				status: ResultStatus.SUCCESS,
				data: product,
			});
		}
	}

	return HttpResponse.json(
		{
			status: ResultStatus.ERROR,
			message: "Product not found",
		},
		{ status: 404 }
	);
});

export const createProduct = http.post("/api/partner/products", async ({ request }) => {
	await delay(400);
	const body = (await request.json()) as any;
	const partnerId = body.partnerId || "demo-partner-1";

	const newProduct: Product = {
		id: faker.string.uuid(),
		partnerId,
		name: body.name,
		description: body.description,
		category: body.category,
		price: body.price,
		stock: body.stock,
		imageUrl: body.imageUrl,
		status: body.stock === 0 ? ProductStatus.OutOfStock : body.status,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	const products = getOrCreateProducts(partnerId);
	products.unshift(newProduct);
	productsStore.set(partnerId, products);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: newProduct,
	});
});

export const updateProduct = http.put("/api/partner/products/:id", async ({ params, request }) => {
	await delay(400);
	const { id } = params;
	const body = (await request.json()) as any;

	for (const [partnerId, products] of productsStore.entries()) {
		const productIndex = products.findIndex((p) => p.id === id);
		if (productIndex !== -1) {
			const product = products[productIndex];
			const updatedProduct: Product = {
				...product,
				...body,
				updatedAt: new Date().toISOString(),
			};

			if (updatedProduct.stock === 0) {
				updatedProduct.status = ProductStatus.OutOfStock;
			}

			products[productIndex] = updatedProduct;
			productsStore.set(partnerId, products);

			return HttpResponse.json({
				status: ResultStatus.SUCCESS,
				data: updatedProduct,
			});
		}
	}

	return HttpResponse.json(
		{
			status: ResultStatus.ERROR,
			message: "Product not found",
		},
		{ status: 404 }
	);
});

export const deleteProduct = http.delete("/api/partner/products/:id", async ({ params }) => {
	await delay(300);
	const { id } = params;

	for (const [partnerId, products] of productsStore.entries()) {
		const productIndex = products.findIndex((p) => p.id === id);
		if (productIndex !== -1) {
			products.splice(productIndex, 1);
			productsStore.set(partnerId, products);

			return HttpResponse.json({
				status: ResultStatus.SUCCESS,
				data: null,
			});
		}
	}

	return HttpResponse.json(
		{
			status: ResultStatus.ERROR,
			message: "Product not found",
		},
		{ status: 404 }
	);
});

export const updateStock = http.patch("/api/partner/products/:id/stock", async ({ params, request }) => {
	await delay(200);
	const { id } = params;
	const body = (await request.json()) as any;
	const newStock = body.stock;

	for (const [partnerId, products] of productsStore.entries()) {
		const productIndex = products.findIndex((p) => p.id === id);
		if (productIndex !== -1) {
			const product = products[productIndex];
			product.stock = newStock;
			product.updatedAt = new Date().toISOString();

			if (newStock === 0) {
				product.status = ProductStatus.OutOfStock;
			} else if (product.status === ProductStatus.OutOfStock) {
				product.status = ProductStatus.Available;
			}

			products[productIndex] = product;
			productsStore.set(partnerId, products);

			return HttpResponse.json({
				status: ResultStatus.SUCCESS,
				data: product,
			});
		}
	}

	return HttpResponse.json(
		{
			status: ResultStatus.ERROR,
			message: "Product not found",
		},
		{ status: 404 }
	);
});

export const toggleAvailability = http.patch("/api/partner/products/:id/toggle", async ({ params }) => {
	await delay(200);
	const { id } = params;

	for (const [partnerId, products] of productsStore.entries()) {
		const productIndex = products.findIndex((p) => p.id === id);
		if (productIndex !== -1) {
			const product = products[productIndex];

			if (product.stock === 0) {
				return HttpResponse.json(
					{
						status: ResultStatus.ERROR,
						message: "Cannot make product available when stock is 0",
					},
					{ status: 400 }
				);
			}

			product.status =
				product.status === ProductStatus.Available ? ProductStatus.Unavailable : ProductStatus.Available;
			product.updatedAt = new Date().toISOString();

			products[productIndex] = product;
			productsStore.set(partnerId, products);

			return HttpResponse.json({
				status: ResultStatus.SUCCESS,
				data: product,
			});
		}
	}

	return HttpResponse.json(
		{
			status: ResultStatus.ERROR,
			message: "Product not found",
		},
		{ status: 404 }
	);
});

export const productHandlers = [
	getProducts,
	getProductDetails,
	createProduct,
	updateProduct,
	deleteProduct,
	updateStock,
	toggleAvailability,
];
