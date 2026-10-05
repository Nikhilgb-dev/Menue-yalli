import { MenuItem } from "../models/MenuItem.js";
import { Owner } from "../models/Owner.js";
import { destroyImage } from "../utils/cloudinary.js";

function buildPublicBaseUrl(request) {
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_URL ||
    `${request.protocol}://${request.get("host")}`
  );
}

function normalizeCategory(value) {
  const category = String(value || "").trim();
  return category.toLowerCase() === "menu" ? "" : category;
}

function normalizeFoodType(value) {
  const foodType = String(value || "veg").trim().toLowerCase();
  return ["veg", "non-veg", "egg"].includes(foodType) ? foodType : "veg";
}

function normalizeUrl(url) {
  const trimmedValue = String(url || "").trim();

  if (!trimmedValue) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

function normalizeSocialLinks(value, existingLinks = []) {
  if (!Array.isArray(value)) {
    return [];
  }

  const existingClickCounts = new Map(
    existingLinks.map((item) => [
      `${String(item.platform || "").trim().toLowerCase()}|${String(item.url || "").trim()}`,
      item.clickCount || 0
    ])
  );

  return value
    .map((item) => {
      const platform = String(item.platform || "").trim();
      const url = normalizeUrl(item.url);

      return {
        platform,
        url,
        ctaLabel: String(item.ctaLabel || "").trim(),
        clickCount:
          existingClickCounts.get(`${platform.toLowerCase()}|${url}`) ||
          Number(item.clickCount || 0)
      };
    })
    .filter((item) => item.platform && item.url);
}

function buildImageUrl(request, imagePath) {
  if (/^https?:\/\//i.test(String(imagePath || ""))) {
    return imagePath;
  }

  return `${request.protocol}://${request.get("host")}${imagePath}`;
}

export async function getDashboard(request, response) {
  const menuItems = await MenuItem.find({ ownerId: request.owner._id }).sort({
    createdAt: -1
  });

  return response.json({
    owner: {
      id: request.owner._id,
      businessName: request.owner.businessName,
      businessType: request.owner.businessType,
      slug: request.owner.slug,
      email: request.owner.email,
      phone: request.owner.phone,
      address: request.owner.address,
      description: request.owner.description,
      scanCount: request.owner.scanCount || 0,
      socialLinks: request.owner.socialLinks
    },
    publicMenuUrl: `${buildPublicBaseUrl(request)}/menu/${request.owner.slug}`,
    qrCodeUrl: `${request.protocol}://${request.get("host")}/api/public/${request.owner.slug}/qr`,
    menuItems: menuItems.map((item) => ({
      id: item._id,
      name: item.name,
      category: normalizeCategory(item.category),
      foodType: normalizeFoodType(item.foodType),
      description: item.description,
      price: item.price,
      available: item.available,
      imageUrl: buildImageUrl(request, item.imagePath)
    }))
  });
}

export async function updateProfile(request, response) {
  const { businessName, businessType, phone, address, description, socialLinks } =
    request.body;

  const owner = await Owner.findByIdAndUpdate(
    request.owner._id,
    {
      businessName: String(businessName || request.owner.businessName).trim(),
      businessType: businessType || request.owner.businessType,
      phone: String(phone || "").trim(),
      address: String(address || "").trim(),
      description: String(description || "").trim(),
      socialLinks: normalizeSocialLinks(socialLinks, request.owner.socialLinks || [])
    },
    { new: true, runValidators: true }
  ).select("-passwordHash");

  return response.json({
    owner: {
      id: owner._id,
      businessName: owner.businessName,
      businessType: owner.businessType,
      slug: owner.slug,
      email: owner.email,
      phone: owner.phone,
      address: owner.address,
      description: owner.description,
      scanCount: owner.scanCount || 0,
      socialLinks: owner.socialLinks
    }
  });
}

export async function deleteAccount(request, response) {
  const menuItems = await MenuItem.find({ ownerId: request.owner._id }).select(
    "_id imagePublicId"
  );

  await Promise.all(
    menuItems.map((item) =>
      item.imagePublicId ? destroyImage(item.imagePublicId).catch(() => undefined) : undefined
    )
  );

  await MenuItem.deleteMany({ ownerId: request.owner._id });
  await Owner.findByIdAndDelete(request.owner._id);

  return response.status(204).send();
}
