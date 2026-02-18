import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:5173",
		credentials: true,
	}),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads")));

// Health check
app.get("/api/health", (req, res) => {
	res.status(200).json({
		status: 0,
		message: "Plindo API is running",
		data: { timestamp: new Date().toISOString() },
	});
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`🚀 Server is running on port ${PORT}`);
	console.log(`📍 Environment: ${process.env.NODE_ENV}`);
	console.log(`📂 Uploads: ${path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads")}`);
});
