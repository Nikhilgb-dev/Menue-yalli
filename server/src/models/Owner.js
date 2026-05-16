import mongoose from "mongoose";

const socialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    ctaLabel: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const ownerSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    businessType: {
      type: String,
      enum: ["food-cart", "hotel", "restaurant", "cafe", "other"],
      default: "food-cart"
    },
    slug: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    socialLinks: { type: [socialLinkSchema], default: [] }
  },
  {
    timestamps: true,
    collection: "owners"
  }
);

export const Owner = mongoose.models.Owner || mongoose.model("Owner", ownerSchema);
