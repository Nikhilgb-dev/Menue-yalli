import { socialPlatformConfigs } from "../config/appConfig";

function createMenuDraft() {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    category: "",
    description: "",
    price: "",
    available: true,
    image: null,
  };
}

function createEditDraft(item) {
  return {
    name: item.name || "",
    category: item.category || "",
    description: item.description || "",
    price: String(item.price ?? ""),
    available: Boolean(item.available),
    image: null,
  };
}

function createLocalId(prefix = "row") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hydrateSocialLinks(links) {
  const linkMap = new Map(
    (Array.isArray(links) ? links : []).map((link) => [
      String(link.platform || "").trim().toLowerCase(),
      link,
    ]),
  );

  return socialPlatformConfigs.map((platformConfig) => {
    const savedLink = linkMap.get(platformConfig.label.toLowerCase()) || {};

    return {
      localId: createLocalId(platformConfig.id),
      platform: platformConfig.label,
      url: savedLink.url || "",
      ctaLabel: savedLink.ctaLabel || platformConfig.defaultCta,
    };
  });
}

function serializeSocialLinks(links) {
  return (links || [])
    .filter(({ url }) => String(url || "").trim())
    .map(({ platform, url, ctaLabel }) => ({
      platform,
      url,
      ctaLabel,
    }));
}

function getSocialPlatformConfigByLabel(platform) {
  return socialPlatformConfigs.find(
    (item) => item.label.toLowerCase() === String(platform || "").trim().toLowerCase(),
  );
}

function slugifyCategory(value) {
  return (
    String(value || "menu")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "menu"
  );
}

function groupMenuItemsByCategory(menuItems) {
  const categoryMap = new Map();

  for (const item of menuItems || []) {
    const category = String(item.category || "").trim() || "Uncategorized";

    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }

    categoryMap.get(category).push(item);
  }

  return Array.from(categoryMap.entries()).map(([category, items]) => ({
    category,
    id: slugifyCategory(category),
    items,
  }));
}

function getMenuCategories(menuItems) {
  return Array.from(
    new Set(
      (menuItems || [])
        .map((item) => String(item.category || "").trim())
        .filter(Boolean),
    ),
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBusinessType(value) {
  return String(value || "other")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export {
  createEditDraft,
  createMenuDraft,
  formatBusinessType,
  formatDateTime,
  getMenuCategories,
  getSocialPlatformConfigByLabel,
  groupMenuItemsByCategory,
  hydrateSocialLinks,
  serializeSocialLinks,
  slugifyCategory,
};
