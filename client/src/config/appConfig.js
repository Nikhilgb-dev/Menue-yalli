function normalizeApiBase(value) {
  const rawValue = String(value || "/api").trim().replace(/\/+$/, "");

  if (!rawValue || rawValue === "/api" || rawValue.endsWith("/api")) {
    return rawValue || "/api";
  }

  return `${rawValue}/api`;
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL);
export const STORAGE_KEY = "menu-platform-session";
export const ADMIN_STORAGE_KEY = "menu-platform-admin-session";

export const shellClass =
  "mx-auto w-full max-w-7xl px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:px-8";
export const panelClass =
  "rounded-[22px] border border-[rgba(83,48,34,0.12)] bg-[rgba(255,251,247,0.96)] p-5 shadow-[0_26px_70px_rgba(88,45,24,0.12)] sm:rounded-[28px] sm:p-8";
export const eyebrowClass =
  "mb-2 text-[0.74rem] font-extrabold uppercase tracking-[0.18em] text-[#d95722]";
export const inputClass =
  "w-full min-w-0 rounded-2xl border border-[rgba(83,48,34,0.12)] bg-[rgba(255,255,255,0.92)] px-4 py-3 text-[#20120e] outline-none transition focus:border-[#d95722]/40 focus:ring-2 focus:ring-[#d95722]/10";
export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#d95722] to-[#9d3c18] px-5 py-3 text-center font-semibold text-white shadow-[0_18px_30px_rgba(157,60,24,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70";
export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[rgba(83,48,34,0.12)] bg-[rgba(255,255,255,0.9)] px-5 py-3 text-center font-medium transition hover:-translate-y-0.5";
export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[rgba(173,47,47,0.15)] bg-[rgba(173,47,47,0.1)] px-5 py-3 text-center font-medium text-[#ad2f2f] transition hover:-translate-y-0.5";

export const defaultCategories = [
  "Juices",
  "Smoothie Bowls",
  "Sundaes & Falooda",
  "Desserts",
  "Waffles",
  "Hot Kitchen",
  "Pasta",
  "Mango Specials",
];

export const foodTypeConfigs = [
  {
    id: "veg",
    label: "Veg",
    dotClassName: "border-[#16803c] text-[#16803c]",
  },
  {
    id: "non-veg",
    label: "Non Veg",
    dotClassName: "border-[#b52525] text-[#b52525]",
  },
  {
    id: "egg",
    label: "Egg",
    dotClassName: "border-[#d99a00] text-[#d99a00]",
  },
];

export const socialPlatformConfigs = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/your-page",
    defaultCta: "Follow on Instagram",
    iconClassName: "text-[#ee2a7b]",
  },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/your-page",
    defaultCta: "Follow on Facebook",
    iconClassName: "text-[#1877f2]",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/91xxxxxxxxxx",
    defaultCta: "Chat on WhatsApp",
    iconClassName: "text-[#25d366]",
  },
  {
    id: "google-reviews",
    label: "Google Reviews",
    placeholder: "https://g.page/.../review",
    defaultCta: "Rate on Google",
    iconClassName: "text-[#4285f4]",
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@yourchannel",
    defaultCta: "Watch on YouTube",
    iconClassName: "text-[#ff0000]",
  },
];
