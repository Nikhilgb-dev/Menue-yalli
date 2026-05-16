import mongoose from "mongoose";

export async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is required for this platform.");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
}
