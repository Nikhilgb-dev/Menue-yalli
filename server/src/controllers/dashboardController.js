import { MenuItem } from "../models/MenuItem.js";
import { Owner } from "../models/Owner.js";

function buildPublicBaseUrl(request) {
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_URL ||
    `${request.protocol}://${request.get("host")}`
  );
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

function normalizeSocialLinks(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      platform: String(item.platform || "").trim(),
      url: normalizeUrl(item.url),
      ctaLabel: String(item.ctaLabel || "").trim()
    }))
    .filter((item) => item.platform && item.url);
}

function buildImageUrl(request, imagePath) {
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
      socialLinks: request.owner.socialLinks
    },
    publicMenuUrl: `${buildPublicBaseUrl(request)}/menu/${request.owner.slug}`,
    qrCodeUrl: `${request.protocol}://${request.get("host")}/api/public/${request.owner.slug}/qr`,
    menuItems: menuItems.map((item) => ({
      id: item._id,
      name: item.name,
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
      socialLinks: normalizeSocialLinks(socialLinks)
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
      socialLinks: owner.socialLinks
    }
  });
}
