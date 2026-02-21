import mongoose from "mongoose";

const partnerCalendarEventSchema = new mongoose.Schema(
	{
		partnerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Partner",
			required: true,
			index: true,
		},
		title: { type: String, required: true, trim: true },
		description: { type: String, default: "" },
		start: { type: Date, required: true },
		end: { type: Date, required: true },
		color: { type: String, default: "#6b7280" },
		backgroundColor: { type: String, default: "#6b7280" },
		type: {
			type: String,
			enum: ["event", "blocked", "break"],
			default: "event",
		},
	},
	{ timestamps: true },
);

const PartnerCalendarEvent = mongoose.model(
	"PartnerCalendarEvent",
	partnerCalendarEventSchema,
);

export default PartnerCalendarEvent;
