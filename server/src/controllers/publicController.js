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
  return `${request.protocol}://${request.get("host")}${imagePath}`;
}

export async function getPublicMenu(request, response) {
  const owner = await Owner.findOne({ slug: request.params.slug }).select("-passwordHash");

  if (!owner) {
    return response.status(404).json({ message: "Menu not found." });
  }

  const menuItems = await MenuItem.find({
    ownerId: owner._id,
    available: true
  }).sort({ createdAt: -1 });

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
