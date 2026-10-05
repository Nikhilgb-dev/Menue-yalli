import QRCode from "qrcode";
import { MenuItem } from "../models/MenuItem.js";
import { Owner } from "../models/Owner.js";

function buildPublicBaseUrl(request) {
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_URL ||
    `${request.protocol}://${request.get("host")}`
  );
}

function buildImageUrl(request, imagePath) {
  if (/^https?:\/\//i.test(String(imagePath || ""))) {
    return imagePath;
  }

  return `${request.protocol}://${request.get("host")}${imagePath}`;
}

function normalizeCategory(value) {
  const category = String(value || "").trim();
  return category.toLowerCase() === "menu" ? "" : category;
}

function normalizeFoodType(value) {
  const foodType = String(value || "veg").trim().toLowerCase();
  return ["veg", "non-veg", "egg"].includes(foodType) ? foodType : "veg";
}

export async function getPublicMenu(request, response) {
  const owner = await Owner.findOne({ slug: request.params.slug }).select("-passwordHash");

  if (!owner) {
    return response.status(404).json({ message: "Menu not found." });
  }

  const menuItems = await MenuItem.find({
    ownerId: owner._id,
    available: true
  }).sort({ category: 1, createdAt: -1 });

  await Owner.updateOne({ _id: owner._id }, { $inc: { scanCount: 1 } });

  return response.json({
    owner: {
      businessName: owner.businessName,
      businessType: owner.businessType,
      slug: owner.slug,
      phone: owner.phone,
      address: owner.address,
      description: owner.description,
      socialLinks: owner.socialLinks
    },
    menuItems: menuItems.map((item) => ({
      id: item._id,
      name: item.name,
      category: normalizeCategory(item.category),
      foodType: normalizeFoodType(item.foodType),
      description: item.description,
      price: item.price,
      imageUrl: buildImageUrl(request, item.imagePath)
    }))
  });
}

export async function getQrCode(request, response) {
  const owner = await Owner.findOne({ slug: request.params.slug }).select("_id slug");

  if (!owner) {
    return response.status(404).json({ message: "Menu not found." });
  }

  const publicMenuUrl = `${buildPublicBaseUrl(request)}/menu/${owner.slug}`;
  const qrBuffer = await QRCode.toBuffer(publicMenuUrl, {
    width: 480,
    margin: 2,
    color: {
      dark: "#271911",
      light: "#FFFFFFFF"
    }
  });

  response.setHeader("Content-Type", "image/png");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${owner.slug}-menu-qr.png"`
  );

  return response.send(qrBuffer);
}

export async function trackSocialClick(request, response) {
  const owner = await Owner.findOne({ slug: request.params.slug });

  if (!owner) {
    return response.status(404).json({ message: "Menu not found." });
  }

  const platform = String(request.body?.platform || "").trim();
  const url = String(request.body?.url || "").trim();
  const socialLink = owner.socialLinks.find(
    (link) =>
      link.platform.toLowerCase() === platform.toLowerCase() &&
      link.url === url
  );

  if (!socialLink) {
    return response.status(404).json({ message: "Social link not found." });
  }

  socialLink.clickCount = (socialLink.clickCount || 0) + 1;
  await owner.save();

  return response.json({
    ok: true,
    platform: socialLink.platform,
    clickCount: socialLink.clickCount
  });
}
