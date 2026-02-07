import { faker } from "@faker-js/faker";
import { HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";
import { type ProductOrder, ProductOrderStatus } from "@/types/product";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const productOrdersStore = new Map<string, ProductOrder[]>();

// Car-related product names grouped by type (matches products mock data)
const carProductItems = [
	{ name: "Premium Engine Oil 5W-30", price: 42.99 },
	{ name: "Synthetic Motor Oil 10W-40", price: 38.5 },
	{ name: "Brake Fluid DOT 4", price: 12.99 },
	{ name: "Coolant Antifreeze", price: 15.99 },
	{ name: "Car Wash Shampoo 1L", price: 8.99 },
	{ name: "Glass Cleaner Spray", price: 6.5 },
	{ name: "Interior Detailing Spray", price: 11.99 },
	{ name: "Tire Shine Gel", price: 9.99 },
	{ name: "Microfiber Cleaning Cloth Set", price: 14.99 },
	{ name: "Air Freshener", price: 4.99 },
	{ name: "Wiper Blade Set", price: 24.99 },
	{ name: "Air Filter", price: 18.5 },
	{ name: "Cabin Air Filter", price: 16.99 },
	{ name: "Headlight Bulb H7", price: 12.99 },
	{ name: "Leather Conditioner", price: 13.99 },
	{ name: "Floor Mat Set", price: 34.99 },
];

const serviceNames = [
	"Premium Car Wash",
	"Full Interior & Exterior Wash",
	"Basic Car Wash",
	"Express Wash",
	"Interior Deep Clean",
	"Full Detailing Package",
	"Pick & Wash Service",
	"Washing Van Service",
];

const generateOrderNumber = () => {
	const prefix = "PO";
	const date = new Date();
	const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
	const random = faker.string.alphanumeric({ length: 6, casing: "upper" });
	return `${prefix}-${dateStr}-${random}`;
};

const generateBookingRef = () => {
	const prefix = "BK";
	const random = faker.string.alphanumeric({ length: 8, casing: "upper" });
	return `${prefix}-${random}`;
};

const generateProductOrder = (partnerId: string): ProductOrder => {
	const numProducts = faker.number.int({ min: 1, max: 3 });
	const selectedItems = faker.helpers.arrayElements(carProductItems, numProducts);
	const products = selectedItems.map((item) => ({
		productId: faker.string.uuid(),
		name: item.name,
		quantity: faker.number.int({ min: 1, max: 3 }),
		price: item.price,
	}));

	const totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
	const orderDate = faker.date.recent({ days: 30 });
	const status = faker.helpers.arrayElement([
		ProductOrderStatus.Pending,
		ProductOrderStatus.Ready,
		ProductOrderStatus.Collected,
		ProductOrderStatus.Cancelled,
	]);

	let pickupDate: string | undefined;
	if (status === ProductOrderStatus.Collected) {
		pickupDate = faker.date.between({ from: orderDate, to: new Date() }).toISOString();
	}

	return {
		id: faker.string.uuid(),
		orderNumber: generateOrderNumber(),
		bookingId: faker.string.uuid(),
		bookingRef: generateBookingRef(),
		serviceName: faker.helpers.arrayElement(serviceNames),
		customerId: faker.string.uuid(),
		customerName: faker.person.fullName(),
		customerPhone: faker.phone.number(),
		partnerId,
		products,
		totalAmount: Math.round(totalAmount * 100) / 100,
		status,
		orderDate: orderDate.toISOString(),
		pickupDate,
		createdAt: orderDate.toISOString(),
		updatedAt: faker.date.recent({ days: 5 }).toISOString(),
	};
};

const getOrCreateProductOrders = (partnerId: string): ProductOrder[] => {
	if (!productOrdersStore.has(partnerId)) {
		const orders = Array.from({ length: faker.number.int({ min: 10, max: 25 }) }, () =>
			generateProductOrder(partnerId),
		);
		productOrdersStore.set(partnerId, orders);
	}
	return productOrdersStore.get(partnerId) ?? [];
};

export const getProductOrders = http.get("/api/partner/product-orders", async ({ request }) => {
	await delay(300);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const page = Number.parseInt(url.searchParams.get("page") || "1");
	const limit = Number.parseInt(url.searchParams.get("limit") || "10");
	const statusFilter = url.searchParams.get("status") || "";

	let orders = getOrCreateProductOrders(partnerId);

	if (statusFilter && statusFilter !== "all") {
		orders = orders.filter((o) => o.status === statusFilter);
	}

	orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

	const total = orders.length;
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;
	const items = orders.slice(startIndex, endIndex);

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

export const getProductOrderDetails = http.get("/api/partner/product-orders/:id", async ({ params }) => {
	await delay(200);
	const { id } = params;

	for (const orders of productOrdersStore.values()) {
		const order = orders.find((o) => o.id === id);
		if (order) {
			return HttpResponse.json({
				status: ResultStatus.SUCCESS,
				data: order,
			});
		}
	}

	return HttpResponse.json(
		{
			status: ResultStatus.ERROR,
			message: "Order not found",
		},
		{ status: 404 },
	);
});

export const updateOrderStatus = http.patch("/api/partner/product-orders/:id/status", async ({ params, request }) => {
	await delay(300);
	const { id } = params;
	const body = (await request.json()) as any;
	const newStatus = body.status;

	for (const [partnerId, orders] of productOrdersStore.entries()) {
		const orderIndex = orders.findIndex((o) => o.id === id);
		if (orderIndex !== -1) {
			const order = orders[orderIndex];
			order.status = newStatus;
			order.updatedAt = new Date().toISOString();

			if (newStatus === ProductOrderStatus.Collected && !order.pickupDate) {
				order.pickupDate = new Date().toISOString();
			}

			orders[orderIndex] = order;
			productOrdersStore.set(partnerId, orders);

			return HttpResponse.json({
				status: ResultStatus.SUCCESS,
				data: order,
			});
		}
	}

	return HttpResponse.json(
		{
			status: ResultStatus.ERROR,
			message: "Order not found",
		},
		{ status: 404 },
	);
});

export const cancelOrder = http.post("/api/partner/product-orders/:id/cancel", async ({ params }) => {
	await delay(300);
	const { id } = params;

	for (const [partnerId, orders] of productOrdersStore.entries()) {
		const orderIndex = orders.findIndex((o) => o.id === id);
		if (orderIndex !== -1) {
			const order = orders[orderIndex];
			order.status = ProductOrderStatus.Cancelled;
			order.updatedAt = new Date().toISOString();

			orders[orderIndex] = order;
			productOrdersStore.set(partnerId, orders);

			return HttpResponse.json({
				status: ResultStatus.SUCCESS,
				data: order,
			});
		}
	}

	return HttpResponse.json(
		{
			status: ResultStatus.ERROR,
			message: "Order not found",
		},
		{ status: 404 },
	);
});

export const productOrderHandlers = [getProductOrders, getProductOrderDetails, updateOrderStatus, cancelOrder];
