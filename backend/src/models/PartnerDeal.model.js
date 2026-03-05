import mongoose from "mongoose";

const partnerDealSchema = new mongoose.Schema(
	{
		partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true, index: true },
		title: { type: String, required: true, trim: true },
		description: { type: String, trim: true },
		services: [{ type: String }],
		originalPrice: { type: Number, required: true },
		discountedPrice: { type: Number, required: true },
		validUntil: { type: Date },
		isMonthlyPackage: { type: Boolean, default: false },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

const PartnerDeal = mongoose.model("PartnerDeal", partnerDealSchema);
export default PartnerDeal;
