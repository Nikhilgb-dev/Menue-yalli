import mongoose from "mongoose";

const adminAccountSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: { type: String, required: true }
  },
  {
    timestamps: true,
    collection: "admin_accounts"
  }
);

export const AdminAccount =
  mongoose.models.AdminAccount || mongoose.model("AdminAccount", adminAccountSchema);
