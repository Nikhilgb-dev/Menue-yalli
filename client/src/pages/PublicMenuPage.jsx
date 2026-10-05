import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, eyebrowClass, panelClass, shellClass } from "../config/appConfig";
import SocialIcon from "../components/SocialIcon";
import { FoodTypeIcon, StatusScreen } from "../components/ui";
import {
  getFoodTypeConfig,
  getMenuCategories,
  groupMenuItemsByCategory,
  slugifyCategory,
} from "../utils/menu";
import { parseApiResponse } from "../utils/session";

function PublicMenuPage() {
  const { slug } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const topRef = useRef(null);
  const sectionRefs = useRef({});
  const publicCategories = getMenuCategories(payload?.menuItems || []);
  const groupedMenuItems = groupMenuItemsByCategory(payload?.menuItems || []);

  useEffect(() => {
    async function loadPublicMenu() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE}/public/${slug}`);
        const data = await parseApiResponse(response);

        if (!response.ok) {
          throw new Error(data.message || "Unable to load menu.");
        }

        setPayload(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadPublicMenu();
  }, [slug]);

  useEffect(() => {
    setActiveCategory("all");
  }, [slug]);

  function handleCategorySelect(category) {
    setActiveCategory(category);

    if (category === "all") {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const categoryId = slugifyCategory(category);
    window.setTimeout(() => {
      sectionRefs.current[categoryId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function trackSocialClick(link) {
    const payloadValue = JSON.stringify({
      platform: link.platform,
      url: link.url,
    });
    const endpoint = `${API_BASE}/public/${slug}/social-click`;

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        endpoint,
        new Blob([payloadValue], { type: "application/json" }),
      );
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payloadValue,
      keepalive: true,
    }).catch(() => undefined);
  }

  if (loading) {
    return <StatusScreen>Loading menu...</StatusScreen>;
  }

  if (error || !payload) {
    return <StatusScreen error>{error || "Menu not found."}</StatusScreen>;
  }

  return (
    <div className={`${shellClass} overflow-x-hidden`} ref={topRef}>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(83,48,34,0.12)] bg-[rgba(255,248,242,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="wrap-break-word text-lg font-black text-[#20120e] sm:text-xl">
              {payload.owner.businessName}
            </h1>
          </div>
        </div>
      </header>

      {payload.owner.socialLinks?.length > 0 ? (
        <section className={`${panelClass} mb-5`}>
          <div className="mb-3">
            <p className={eyebrowClass}>Connect with us</p>
            {/* <h2 className="text-lg font-bold text-[#20120e]">
              Follow or rate our business
            </h2> */}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {payload.owner.socialLinks.map((link, index) => (
              <a
                key={`${link.platform}-${index}-top-icon`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-[rgba(83,48,34,0.12)] bg-white p-2.5"
                aria-label={link.platform}
                title={link.platform}
                onClick={() => trackSocialClick(link)}
              >
                <SocialIcon platform={link.platform} url={link.url} />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className={`${panelClass} mb-5`}>
        <div className="mb-5">
          <p className={eyebrowClass}>Menu</p>
          <h2 className="text-2xl font-black text-[#20120e]">
            {payload.menuItems.length} items available
          </h2>
        </div>
        {publicCategories.length > 0 ? (
          <div className="sticky top-[4.5rem] z-40 mb-6 -mx-5 overflow-x-auto bg-[rgba(255,248,242,0.96)] px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
            <div className="flex w-max min-w-full snap-x snap-mandatory gap-2">
              <button
                type="button"
                className={`shrink-0 snap-start rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  activeCategory === "all"
                    ? "border border-[#20120e] bg-[#20120e] text-white"
                    : "border border-[#20120e]/10 bg-white text-[#20120e] hover:border-[#d95722]/40 hover:text-[#d95722]"
                }`}
                onClick={() => handleCategorySelect("all")}
              >
                All
              </button>
              {publicCategories.map((category) => (
                <button
                  key={slugifyCategory(category)}
                  type="button"
                  className={`shrink-0 snap-start rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                    activeCategory === category
                      ? "border border-[#20120e] bg-[#20120e] text-white"
                      : "border border-[#20120e]/10 bg-white text-[#20120e] hover:border-[#d95722]/40 hover:text-[#d95722]"
                  }`}
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {groupedMenuItems.length > 0 ? (
          <div className="grid gap-8">
            {groupedMenuItems.map((group) => (
              <section
                className="scroll-mt-28"
                key={group.id}
                ref={(element) => {
                  sectionRefs.current[group.id] = element;
                }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-black text-[#20120e]">
                    {group.category}
                  </h3>
                  <span className="text-sm font-semibold text-[#746157]">
                    {group.items.length} items
                  </span>
                </div>

                <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
                  <div className="flex gap-4">
                    {group.items.map((item) => (
                      <article
                        className="w-[82vw] max-w-[22rem] shrink-0 overflow-hidden rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 sm:w-[21rem]"
                        key={item.id}
                      >
                        <div className="flex aspect-4/3 w-full items-center justify-center bg-[#fff8f2] p-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="block h-full w-full object-contain"
                          />
                        </div>
                        <div className="grid gap-4 p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {item.category ? (
                                <span className="w-fit rounded-full bg-[#d95722]/10 px-3 py-1 text-xs font-semibold text-[#d95722]">
                                  {item.category}
                                </span>
                              ) : null}
                              <FoodTypeIcon
                                type={item.foodType}
                                label={getFoodTypeConfig(item.foodType).label}
                              />
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="wrap-break-word text-lg font-bold text-[#20120e]">
                                {item.name}
                              </h4>
                              <span className="shrink-0 rounded-full bg-[#1f6a5b]/10 px-3 py-2 text-center text-sm font-bold text-[#1f6a5b]">
                                Rs. {Number(item.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {item.description ? (
                            <p className="wrap-break-word text-sm leading-6 text-[#746157]">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
            <div className="rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 p-4">
              No menu items are available right now.
            </div>
        )}

      </section>

      {activeCategory !== "all" ? (
        <button
          type="button"
          className="fixed bottom-5 right-5 z-50 rounded-full border border-[#20120e]/10 bg-[#20120e] px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-[#d95722] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d95722] focus-visible:ring-offset-2"
          onClick={() => handleCategorySelect("all")}
        >
          ↑ Back to menu top
        </button>
      ) : null}

      <section className={`${panelClass} mb-5`}>
        <div className="mb-5">
          <p className={eyebrowClass}>Details</p>
          <h2 className="text-2xl font-black text-[#20120e]">
            About this business
          </h2>
        </div>
        <div className="mb-4 grid gap-1">
          <h3 className="wrap-break-word text-xl font-bold text-[#20120e]">
            {payload.owner.businessName}
          </h3>
          <p className="text-sm text-[#746157]">{payload.owner.businessType}</p>
          <p className="wrap-break-word text-sm text-[#746157]">
            {payload.owner.phone || "Contact details not added yet."}
          </p>
        </div>
        <p className="wrap-break-word text-[#746157]">
          {payload.owner.description ||
            "Freshly published menu for this business."}
        </p>
        <p className="mt-3 wrap-break-word text-sm text-[#746157]">
          {payload.owner.address || "Address not added yet."}
        </p>
      </section>

      <footer className={`${panelClass} flex items-center justify-center`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-[#d95722]">
            Powered by
          </span>
          <a
            href="https://menueyalli.cloud"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-end text-sm font-semibold text-[#20120e]"
            aria-label="MenueYalli website"
          >
            <img
              src="/assets/menu_logo.png"
              alt="MenueYalli"
              className="h-6 w-auto object-contain"
            />
            <span>.cloud</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default PublicMenuPage;
