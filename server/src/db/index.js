import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("db success");
  } catch (e) {
    console.log("Error connecting to db", e.message);
    process.exit(1);
  }
};
