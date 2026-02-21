import dotenv from "dotenv";
import mongoose from "mongoose";
import Customer from "./src/models/Customer.model.js";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const customer = await Customer.findOneAndUpdate(
  { email: "testcustomer@plindo.com" },
  {
    name: "Test Customer",
    email: "testcustomer@plindo.com",
    phone: "+357 99 123456",
    status: "active",
  },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

console.log(customer._id.toString());
await mongoose.disconnect();
