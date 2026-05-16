import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    imagePath: { type: String, required: true },
    imagePublicId: { type: String, trim: true, default: "" },
    available: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: "menu_items"
  }
);

export const MenuItem =
  mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
