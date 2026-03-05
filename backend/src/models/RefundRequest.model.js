import mongoose from "mongoose";

const refundRequestSchema = new mongoose.Schema(
	{
		bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
		bookingNumber: { type: String },
		customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
		customerName: { type: String },
		customerEmail: { type: String },
		amount: { type: Number, required: true },
		reason: { type: String },
		cancellationCount: { type: Number, default: 0 },
		status: {
			type: String,
			enum: ["pending_review", "approved", "rejected"],
			default: "pending_review",
			index: true,
		},
		reviewedBy: { type: String },
		reviewedAt: { type: Date },
		reviewNote: { type: String },
	},
	{ timestamps: true },
);

refundRequestSchema.index({ createdAt: -1 });

const RefundRequest = mongoose.model("RefundRequest", refundRequestSchema);
export default RefundRequest;
