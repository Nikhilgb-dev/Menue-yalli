import { MenuItem } from "../models/MenuItem.js";
import { Owner } from "../models/Owner.js";

function buildPublicBaseUrl(request) {
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_URL ||
    `${request.protocol}://${request.get("host")}`
  );
}

export async function getAdminRegistrations(request, response) {
  const [owners, menuStats] = await Promise.all([
    Owner.find({}).sort({ createdAt: -1 }).select("-passwordHash").lean(),
    MenuItem.aggregate([
      {
        $group: {
          _id: "$ownerId",
          menuItemCount: { $sum: 1 },
          visibleMenuItemCount: {
            $sum: {
              $cond: [{ $eq: ["$available", true] }, 1, 0]
            }
          }
        }
      }
    ])
  ]);

  const statsByOwnerId = new Map(
    menuStats.map((item) => [
      String(item._id),
      {
        menuItemCount: item.menuItemCount || 0,
        visibleMenuItemCount: item.visibleMenuItemCount || 0
      }
    ])
  );

  const registrations = owners.map((owner) => {
    const ownerStats = statsByOwnerId.get(String(owner._id)) || {
      menuItemCount: 0,
      visibleMenuItemCount: 0
    };
    const hiddenMenuItemCount =
      ownerStats.menuItemCount - ownerStats.visibleMenuItemCount;

    return {
      id: owner._id,
      businessName: owner.businessName,
      businessType: owner.businessType,
      slug: owner.slug,
      email: owner.email,
      phone: owner.phone,
      address: owner.address,
      description: owner.description,
      socialLinks: owner.socialLinks || [],
      menuItemCount: ownerStats.menuItemCount,
      visibleMenuItemCount: ownerStats.visibleMenuItemCount,
      hiddenMenuItemCount,
      publicMenuUrl: `${buildPublicBaseUrl(request)}/menu/${owner.slug}`,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt
    };
  });

  const summary = registrations.reduce(
    (accumulator, registration) => {
      accumulator.totalRegistrations += 1;
      accumulator.totalMenuItems += registration.menuItemCount;
      accumulator.totalVisibleMenuItems += registration.visibleMenuItemCount;
      accumulator.totalHiddenMenuItems += registration.hiddenMenuItemCount;
      accumulator.totalSocialLinks += registration.socialLinks.length;
      accumulator.businessTypes[registration.businessType] =
        (accumulator.businessTypes[registration.businessType] || 0) + 1;
      return accumulator;
    },
    {
      totalRegistrations: 0,
      totalMenuItems: 0,
      totalVisibleMenuItems: 0,
      totalHiddenMenuItems: 0,
      totalSocialLinks: 0,
      businessTypes: {}
    }
  );

  return response.json({
    admin: request.admin,
    summary,
    registrations
  });
}
