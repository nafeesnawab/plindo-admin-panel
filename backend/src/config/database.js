import mongoose from "mongoose";

// Make all Mongoose documents include virtual 'id' (string alias of _id) in JSON output
mongoose.set("toJSON", { virtuals: true });
mongoose.set("toObject", { virtuals: true });

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`❌ Error: ${error.message}`);
		process.exit(1);
	}
};

export default connectDB;
