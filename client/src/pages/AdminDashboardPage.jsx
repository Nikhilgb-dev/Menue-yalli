import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  API_BASE,
  dangerButtonClass,
  eyebrowClass,
  ghostButtonClass,
  inputClass,
  panelClass,
  shellClass,
} from "../config/appConfig";
import SocialIcon from "../components/SocialIcon";
import { DetailPill, Field, NoticeBox, StatusScreen, SummaryCard } from "../components/ui";
import { formatBusinessType, formatDateTime } from "../utils/menu";
import { parseApiResponse } from "../utils/session";

function AdminDashboardPage({ session, onLogout, onToast }) {
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadRegistrations();
  }, [session.token]);

  async function loadRegistrations() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/admin/registrations`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to load admin dashboard.");
      }

      setPayload(data);
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function handleAdminLogout() {
    onLogout();
    onToast("Admin logged out.");
    navigate("/admin");
  }

  const registrations = payload?.registrations || [];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredRegistrations = normalizedSearchTerm
    ? registrations.filter((registration) =>
        [
          registration.businessName,
          registration.businessType,
          registration.email,
          registration.phone,
          registration.slug,
          registration.address,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchTerm),
      )
    : registrations;

  if (loading) {
    return <StatusScreen>Loading admin dashboard...</StatusScreen>;
  }

  if (error && !payload) {
    return <StatusScreen error>{error}</StatusScreen>;
  }

  return (
    <div className={shellClass}>
      <section className={panelClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-2">
            <p className={eyebrowClass}>Admin Dashboard</p>
            <h1 className="text-3xl font-black text-[#20120e] sm:text-4xl">
              Owner registrations and business details
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[#746157] sm:text-base">
              Review every owner account, menu publishing activity, public menu
              link, and contact information from one place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className={ghostButtonClass}
              type="button"
              onClick={loadRegistrations}
            >
              Refresh
            </button>
            <button
              className={dangerButtonClass}
              type="button"
              onClick={handleAdminLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </section>

      {error ? <NoticeBox tone="error">{error}</NoticeBox> : null}

      <section className={`${panelClass} mt-5`}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Registrations"
            value={payload?.summary?.totalRegistrations || 0}
          />
          <SummaryCard
            label="Menu Items"
            value={payload?.summary?.totalMenuItems || 0}
          />
          <SummaryCard
            label="Visible Items"
            value={payload?.summary?.totalVisibleMenuItems || 0}
          />
          <SummaryCard
            label="Hidden Items"
            value={payload?.summary?.totalHiddenMenuItems || 0}
          />
          <SummaryCard
            label="Social Links"
            value={payload?.summary?.totalSocialLinks || 0}
          />
        </div>
      </section>

      <section className={`${panelClass} mt-5`}>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <Field label="Search by business, email, slug, type, phone, or address">
            <input
              className={inputClass}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search registrations"
            />
          </Field>
          <div className="rounded-2xl border border-[rgba(83,48,34,0.12)] bg-white/70 px-4 py-3 text-sm text-[#746157]">
            Showing {filteredRegistrations.length} of {registrations.length}
          </div>
        </div>
      </section>

      <section className={`${panelClass} mt-5`}>
        <div className="mb-5 flex flex-col gap-2">
          <p className={eyebrowClass}>Registrations</p>
          <h2 className="text-2xl font-black text-[#20120e]">
            Complete owner details
          </h2>
        </div>

        {filteredRegistrations.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredRegistrations.map((registration) => (
              <article
                key={registration.id}
                className="grid gap-5 rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid gap-2">
                    <span className="w-fit rounded-full bg-[#d95722]/10 px-3 py-1 text-xs font-semibold text-[#d95722]">
                      {formatBusinessType(registration.businessType)}
                    </span>
                    <h3 className="wrap-break-word text-2xl font-black text-[#20120e]">
                      {registration.businessName}
                    </h3>
                    <p className="text-sm text-[#746157]">
                      Slug: {registration.slug}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fff8f2] px-4 py-3 text-sm text-[#746157]">
                    <p>Created</p>
                    <p className="font-semibold text-[#20120e]">
                      {formatDateTime(registration.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailPill label="Email" value={registration.email} />
                  <DetailPill
                    label="Phone"
                    value={registration.phone || "Not added"}
                  />
                  <DetailPill
                    label="Menu items"
                    value={registration.menuItemCount}
                  />
                  <DetailPill
                    label="Visible items"
                    value={registration.visibleMenuItemCount}
                  />
                  <DetailPill
                    label="Hidden items"
                    value={registration.hiddenMenuItemCount}
                  />
                  <DetailPill
                    label="Updated"
                    value={formatDateTime(registration.updatedAt)}
                  />
                </div>

                <div className="grid gap-2">
                  <p className="text-sm font-semibold text-[#20120e]">Address</p>
                  <p className="wrap-break-word text-sm text-[#746157]">
                    {registration.address || "Not added"}
                  </p>
                </div>

                <div className="grid gap-2">
                  <p className="text-sm font-semibold text-[#20120e]">
                    Description
                  </p>
                  <p className="wrap-break-word text-sm text-[#746157]">
                    {registration.description || "Not added"}
                  </p>
                </div>

                <div className="grid gap-3">
                  <p className="text-sm font-semibold text-[#20120e]">
                    Social handles
                  </p>
                  {registration.socialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {registration.socialLinks.map((link, index) => (
                        <a
                          key={`${registration.id}-${link.platform}-${index}`}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-[rgba(83,48,34,0.12)] bg-white px-4 py-2 text-sm font-medium text-[#20120e]"
                        >
                          <SocialIcon
                            platform={link.platform}
                            url={link.url}
                            className="h-8 w-8 rounded-full"
                          />
                          <span>{link.platform}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#746157]">No social handles added.</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <p className="text-sm font-semibold text-[#20120e]">
                    Public menu link
                  </p>
                  <a
                    href={registration.publicMenuUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="wrap-break-word text-sm font-medium text-[#d95722] underline decoration-[#d95722]/35 underline-offset-4"
                  >
                    {registration.publicMenuUrl}
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 p-4">
            No registrations match the current search.
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboardPage;
