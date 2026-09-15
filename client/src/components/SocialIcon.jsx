import { socialPlatformConfigs } from "../config/appConfig";
import { getSocialPlatformConfigByLabel } from "../utils/menu";

function SocialIcon({ platform, url, className = "" }) {
  const config =
    getSocialPlatformConfigByLabel(platform) ||
    socialPlatformConfigs.find((item) =>
      String(url || "").toLowerCase().includes(item.label.toLowerCase()),
    ) ||
    socialPlatformConfigs[0];
  const classes =
    `inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white ${config.iconClassName} ${className}`.trim();

  const brandKey = config.id;

  return (
    <span className={classes} aria-hidden="true">
      {brandKey === "instagram" ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.95 1.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 6.85A5.15 5.15 0 1 1 6.85 12 5.16 5.16 0 0 1 12 6.85Zm0 1.8A3.35 3.35 0 1 0 15.35 12 3.35 3.35 0 0 0 12 8.65Z" />
        </svg>
      ) : null}
      {brandKey === "facebook" ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6h1.5V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3Z" />
        </svg>
      ) : null}
      {brandKey === "whatsapp" ? (
        <svg viewBox="0 0 32 32" className="h-5 w-5 fill-current">
          <path d="M16 3.2a12.8 12.8 0 0 0-11.1 19.2L3 29l6.9-1.8A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.5 10.5 0 0 1-5.3-1.4l-.4-.2-4 .9 1-3.8-.2-.4A10.5 10.5 0 1 1 16 26.4Zm5.8-7.4c-.3-.2-1.8-.9-2-1s-.5-.2-.7.2-.8 1-1 1.3-.4.2-.7.1a8.6 8.6 0 0 1-2.5-1.5 9.3 9.3 0 0 1-1.8-2.2c-.2-.3 0-.5.1-.6l.5-.6.2-.5a.9.9 0 0 0 0-.6c-.1-.2-.7-1.7-1-2.4s-.5-.6-.7-.6h-.6a1.7 1.7 0 0 0-1.1.5 4.2 4.2 0 0 0-1.3 3.1 7.3 7.3 0 0 0 1.6 4 16.5 16.5 0 0 0 6.4 5.7c2.2 1 2.7.8 3.2.7a3.7 3.7 0 0 0 2.4-1.7 3.1 3.1 0 0 0 .2-1.7c-.1-.1-.3-.2-.6-.4Z" />
        </svg>
      ) : null}
      {brandKey === "google-reviews" ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3a9.9 9.9 0 0 0 3-7.4Z" />
          <path d="M12 22a9.7 9.7 0 0 0 6.8-2.5l-3.3-2.6a6.1 6.1 0 0 1-9.1-3.2H3v2.7A10 10 0 0 0 12 22Z" />
          <path d="M6.4 13.7a6 6 0 0 1 0-3.4V7.6H3a10 10 0 0 0 0 8.8l3.4-2.7Z" />
          <path d="M12 5.9a5.4 5.4 0 0 1 3.8 1.5l2.8-2.8A9.6 9.6 0 0 0 3 7.6l3.4 2.7A6 6 0 0 1 12 5.9Z" />
        </svg>
      ) : null}
      {brandKey === "youtube" ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8ZM9.7 15.1V8.9l5.4 3.1-5.4 3.1Z" />
        </svg>
      ) : null}
    </span>
  );
}

export default SocialIcon;
