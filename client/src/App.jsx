import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const STORAGE_KEY = "menu-platform-session";
const ADMIN_STORAGE_KEY = "menu-platform-admin-session";

const shellClass =
  "mx-auto w-full max-w-7xl px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:px-8";
const panelClass =
  "rounded-[22px] border border-[rgba(83,48,34,0.12)] bg-[rgba(255,251,247,0.96)] p-5 shadow-[0_26px_70px_rgba(88,45,24,0.12)] sm:rounded-[28px] sm:p-8";
const eyebrowClass =
  "mb-2 text-[0.74rem] font-extrabold uppercase tracking-[0.18em] text-[#d95722]";
const inputClass =
  "w-full min-w-0 rounded-2xl border border-[rgba(83,48,34,0.12)] bg-[rgba(255,255,255,0.92)] px-4 py-3 text-[#20120e] outline-none transition focus:border-[#d95722]/40 focus:ring-2 focus:ring-[#d95722]/10";
const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#d95722] to-[#9d3c18] px-5 py-3 text-center font-semibold text-white shadow-[0_18px_30px_rgba(157,60,24,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70";
const ghostButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[rgba(83,48,34,0.12)] bg-[rgba(255,255,255,0.9)] px-5 py-3 text-center font-medium transition hover:-translate-y-0.5";
const dangerButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[rgba(173,47,47,0.15)] bg-[rgba(173,47,47,0.1)] px-5 py-3 text-center font-medium text-[#ad2f2f] transition hover:-translate-y-0.5";
const defaultCategories = [
  "Juices",
  "Smoothie Bowls",
  "Sundaes & Falooda",
  "Desserts",
  "Waffles",
  "Hot Kitchen",
  "Pasta",
  "Mango Specials",
];
const socialPlatformConfigs = [
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

function readStoredSession(storageKey) {
  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    return {};
  }
}

function persistSession(storageKey, session) {
  window.localStorage.setItem(storageKey, JSON.stringify(session));
}

function clearSession(storageKey) {
  window.localStorage.removeItem(storageKey);
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

function App() {
  const [session, setSession] = useState(() => ({
    token: "",
    owner: null,
    ...readStoredSession(STORAGE_KEY),
  }));
  const [adminSession, setAdminSession] = useState(() => ({
    token: "",
    admin: null,
    ...readStoredSession(ADMIN_STORAGE_KEY),
  }));
  const [toasts, setToasts] = useState([]);
  const location = useLocation();
  const isPublicMenuRoute = location.pathname.startsWith("/menu/");
  const isAdminRoute = location.pathname.startsWith("/admin");

  function showToast(message, tone = "success") {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, tone }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }

  function handleAuthSuccess(payload) {
    const nextSession = {
      token: payload.token,
      owner: payload.owner,
    };

    setSession(nextSession);
    persistSession(STORAGE_KEY, nextSession);
  }

  function handleLogout() {
    clearSession(STORAGE_KEY);
    setSession({ token: "", owner: null });
  }

  function handleAdminAuthSuccess(payload) {
    const nextSession = {
      token: payload.token,
      admin: payload.admin,
    };

    setAdminSession(nextSession);
    persistSession(ADMIN_STORAGE_KEY, nextSession);
  }

  function handleAdminLogout() {
    clearSession(ADMIN_STORAGE_KEY);
    setAdminSession({ token: "", admin: null });
  }

  return (
    <>
      {!isPublicMenuRoute ? (
        <Navbar
          owner={session.owner}
          admin={adminSession.admin}
          isAuthenticated={Boolean(session.token)}
          isAdminRoute={isAdminRoute}
        />
      ) : null}
      <ToastViewport toasts={toasts} />
      <Routes>
        <Route
          path="/"
          element={
            session.token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} onToast={showToast} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            session.token ? (
              <DashboardPage
                session={session}
                onAuthRefresh={handleAuthSuccess}
                onLogout={handleLogout}
                onToast={showToast}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            adminSession.token ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <AdminAuthPage
                onAuthSuccess={handleAdminAuthSuccess}
                onToast={showToast}
              />
            )
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            adminSession.token ? (
              <AdminDashboardPage
                session={adminSession}
                onLogout={handleAdminLogout}
                onToast={showToast}
              />
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route path="/menu/:slug" element={<PublicMenuPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function Navbar({ owner, admin, isAuthenticated, isAdminRoute }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(83,48,34,0.12)] bg-[rgba(255,248,242,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/assets/menu_logo.png"
            alt="MenuYalli"
            className="h-8 w-auto object-contain"
          />
        </div>
        {isAdminRoute && admin ? (
          <div className="text-right">
            <p className="text-sm font-semibold text-[#20120e]">Admin Dashboard</p>
            <p className="text-xs text-[#746157]">{admin.email}</p>
          </div>
        ) : isAuthenticated ? (
          <div className="text-right">
            <p className="text-sm font-semibold text-[#20120e]">
              {owner?.businessName}
            </p>
            <p className="text-xs text-[#746157]">
              {owner?.slug || "owner-dashboard"}
            </p>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function AuthPage({ onAuthSuccess, onToast }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signup");
  const [showReset, setShowReset] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    businessType: "food-cart",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const payload =
        mode === "signup"
          ? form
          : {
              email: form.email,
              password: form.password,
            };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed.");
      }

      onAuthSuccess(data);
      onToast(
        mode === "signup" ? "Account created successfully." : "Logged in successfully.",
      );
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`${shellClass} grid min-h-screen items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]`}
    >
      <section className={panelClass}>
        <div className="mb-4">
          <img
            src="/assets/menu_logo.png"
            alt="MenuYalli"
            className="h-10 w-auto object-contain"
          />
        </div>
        <p className={eyebrowClass}>Multi-Tenant QR Menu Platform</p>
        <h2 className="max-w-3xl text-4xl font-black leading-tight text-[#20120e] sm:text-5xl">
          Create one menu per cart or hotel, then share it with a private QR.
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[#746157] sm:text-[1.04rem]">
          Every owner gets a dedicated dashboard, public menu page, and
          downloadable QR. Scanning Cart A&apos;s QR opens only Cart A&apos;s
          items, never another owner&apos;s menu.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {[
            "Owner signup and login",
            "Multiple item uploads",
            "Per-business public page",
            "Review and social links",
          ].map((point) => (
            <span
              key={point}
              className="rounded-full border border-[#d95722]/15 bg-[#d95722]/8 px-4 py-3 text-sm font-bold"
            >
              {point}
            </span>
          ))}
        </div>
      </section>

      <section className={panelClass}>
        {showReset ? (
          <PasswordResetForm
            defaultEmail={form.email}
            heading="Reset owner password"
            description="Enter the registered owner email and set a new password."
            onBack={() => setShowReset(false)}
            onToast={onToast}
          />
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3">
              {["signup", "login"].map((currentMode) => (
                <button
                  key={currentMode}
                  type="button"
                  className={`rounded-full border px-4 py-3 font-medium transition ${
                    mode === currentMode
                      ? "border-[#20120e] bg-[#20120e] text-white"
                      : "border-[rgba(83,48,34,0.12)] bg-transparent text-[#20120e]"
                  }`}
                  onClick={() => {
                    setMode(currentMode);
                    setShowReset(false);
                  }}
                >
                  {currentMode === "signup" ? "Sign Up" : "Login"}
                </button>
              ))}
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <>
                  <Field label="Business name">
                    <input
                      className={inputClass}
                      name="businessName"
                      value={form.businessName}
                      onChange={updateField}
                      placeholder="Cart A or Green Leaf Hotel"
                      required
                    />
                  </Field>
                  <Field label="Business type">
                    <select
                      className={inputClass}
                      name="businessType"
                      value={form.businessType}
                      onChange={updateField}
                    >
                      <option value="food-cart">Food Cart</option>
                      <option value="hotel">Hotel</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="cafe">Cafe</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                </>
              ) : null}

              <Field label="Email">
                <input
                  className={inputClass}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="owner@example.com"
                  required
                />
              </Field>

              <Field label="Password">
                <div className="grid gap-2">
                  <input
                    className={inputClass}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={updateField}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    className="w-fit text-sm font-medium text-[#746157] underline decoration-[#d95722]/35 underline-offset-4"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "Hide password" : "View password"}
                  </button>
                </div>
              </Field>

              {error ? (
                <p className="text-sm font-medium text-[#ad2f2f]">{error}</p>
              ) : null}

              <button
                className={primaryButtonClass}
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Please wait..."
                  : mode === "signup"
                    ? "Create Owner Account"
                    : "Login to Dashboard"}
              </button>

              {mode === "login" ? (
                <button
                  className="text-left text-sm font-medium text-[#746157] underline decoration-[#d95722]/35 underline-offset-4"
                  type="button"
                  onClick={() => setShowReset(true)}
                >
                  Forgot password?
                </button>
              ) : null}

              <div className="pt-1 text-center">
                <a
                  href="/admin"
                  className="text-sm font-medium text-[#746157] underline decoration-[#d95722]/35 underline-offset-4"
                >
                  Admin login
                </a>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function AdminAuthPage({ onAuthSuccess, onToast }) {
  const navigate = useNavigate();
  const [showReset, setShowReset] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to login as admin.");
      }

      onAuthSuccess(data);
      onToast("Admin login successful.");
      navigate("/admin/dashboard");
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`${shellClass} grid min-h-screen items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]`}
    >
      <section className={panelClass}>
        <p className={eyebrowClass}>Admin Access</p>
        <h2 className="max-w-3xl text-4xl font-black leading-tight text-[#20120e] sm:text-5xl">
          Track every owner registration from one place.
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[#746157] sm:text-[1.04rem]">
          Monitor registered businesses, contact details, public menu links,
          social links, and menu publishing activity through a dedicated admin
          dashboard.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            "Registration history",
            "Business contact details",
            "Menu item activity",
            "Public menu links",
          ].map((point) => (
            <span
              key={point}
              className="rounded-full border border-[#d95722]/15 bg-[#d95722]/8 px-4 py-3 text-sm font-bold"
            >
              {point}
            </span>
          ))}
        </div>
      </section>

      <section className={panelClass}>
        {showReset ? (
          <PasswordResetForm
            defaultEmail={form.email}
            heading="Reset admin password"
            description="Enter the registered admin email and set a new password."
            onBack={() => setShowReset(false)}
            onToast={onToast}
          />
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-2xl font-black text-[#20120e]">Admin Login</h3>
              <p className="mt-2 text-sm text-[#746157]">
                Use the configured admin credentials to open the registrations
                dashboard.
              </p>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Field label="Admin email">
                <input
                  className={inputClass}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="admin@menuyelli.cloud"
                  required
                />
              </Field>

              <Field label="Password">
                <div className="grid gap-2">
                  <input
                    className={inputClass}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={updateField}
                    placeholder="Enter admin password"
                    required
                  />
                  <button
                    className="w-fit text-sm font-medium text-[#746157] underline decoration-[#d95722]/35 underline-offset-4"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "Hide password" : "View password"}
                  </button>
                </div>
              </Field>

              {error ? (
                <p className="text-sm font-medium text-[#ad2f2f]">{error}</p>
              ) : null}

              <button
                className={primaryButtonClass}
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Please wait..." : "Open Admin Dashboard"}
              </button>

              <button
                className="text-left text-sm font-medium text-[#746157] underline decoration-[#d95722]/35 underline-offset-4"
                type="button"
                onClick={() => setShowReset(true)}
              >
                Forgot password?
              </button>

              <div className="pt-1 text-center">
                <a
                  href="/"
                  className="text-sm font-medium text-[#746157] underline decoration-[#d95722]/35 underline-offset-4"
                >
                  Back to owner signup and login
                </a>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function PasswordResetForm({
  defaultEmail = "",
  heading,
  description,
  onBack,
  onToast,
}) {
  const [form, setForm] = useState({
    email: defaultEmail,
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (form.password !== form.confirmPassword) {
      const message = "Passwords do not match.";
      setError(message);
      onToast(message, "error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to reset password.");
      }

      const message = `${data.accountType === "admin" ? "Admin" : "Owner"} password reset successful.`;
      setSuccessMessage(message);
      onToast(message);
      setForm((current) => ({
        ...current,
        password: "",
        confirmPassword: "",
      }));
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <h3 className="text-2xl font-black text-[#20120e]">{heading}</h3>
        <p className="mt-2 text-sm text-[#746157]">{description}</p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Registered email">
          <input
            className={inputClass}
            type="email"
            name="email"
            value={form.email}
            onChange={updateField}
            placeholder="Enter registered email"
            required
          />
        </Field>

        <Field label="New password">
          <input
            className={inputClass}
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={updateField}
            placeholder="Enter new password"
            required
            minLength={6}
          />
        </Field>

        <Field label="Confirm new password">
          <div className="grid gap-2">
            <input
              className={inputClass}
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateField}
              placeholder="Re-enter new password"
              required
              minLength={6}
            />
            <button
              className="w-fit text-sm font-medium text-[#746157] underline decoration-[#d95722]/35 underline-offset-4"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide password" : "View password"}
            </button>
          </div>
        </Field>

        {error ? (
          <p className="text-sm font-medium text-[#ad2f2f]">{error}</p>
        ) : null}
        {successMessage ? (
          <p className="text-sm font-medium text-[#1d7d53]">{successMessage}</p>
        ) : null}

        <button
          className={primaryButtonClass}
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Please wait..." : "Reset Password"}
        </button>

        <button
          className="text-left text-sm font-medium text-[#746157] underline decoration-[#d95722]/35 underline-offset-4"
          type="button"
          onClick={onBack}
        >
          Back to login
        </button>
      </form>
    </div>
  );
}

function DashboardPage({ session, onAuthRefresh, onLogout, onToast }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [menuSaving, setMenuSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState("");
  const [editMenuSaving, setEditMenuSaving] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [editDraft, setEditDraft] = useState(null);
  const [fileInputSeed, setFileInputSeed] = useState(0);
  const groupedDashboardItems = groupMenuItemsByCategory(dashboard?.menuItems || []);
  const ownerCategories = Array.from(
    new Set([...defaultCategories, ...getMenuCategories(dashboard?.menuItems || [])]),
  );
  const [profileForm, setProfileForm] = useState({
    businessName: "",
    businessType: "food-cart",
    phone: "",
    address: "",
    description: "",
    socialLinks: [],
  });
  const [menuDrafts, setMenuDrafts] = useState([createMenuDraft()]);

  useEffect(() => {
    loadDashboard();
  }, [session.token]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/dashboard`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load dashboard.");
      }

      setDashboard(data);
      setProfileForm({
        businessName: data.owner.businessName || "",
        businessType: data.owner.businessType || "food-cart",
        phone: data.owner.phone || "",
        address: data.owner.address || "",
        description: data.owner.description || "",
        socialLinks: hydrateSocialLinks(data.owner.socialLinks),
      });
      onAuthRefresh({ token: session.token, owner: data.owner });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function updateProfileField(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  }

  function updateSocialLink(index, field, value) {
    setProfileForm((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link,
      ),
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileSaving(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/dashboard/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          ...profileForm,
          socialLinks: serializeSocialLinks(profileForm.socialLinks),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save profile.");
      }

      onAuthRefresh({ token: session.token, owner: data.owner });
      setNotice("Dashboard profile updated.");
      onToast("Business profile updated.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setProfileSaving(false);
    }
  }

  function addMenuDraft() {
    setMenuDrafts((current) => [...current, createMenuDraft()]);
  }

  function removeMenuDraft(draftId) {
    setMenuDrafts((current) =>
      current.length === 1
        ? current
        : current.filter((draft) => draft.id !== draftId),
    );
  }

  function updateMenuDraft(draftId, field, value) {
    setMenuDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId ? { ...draft, [field]: value } : draft,
      ),
    );
  }

  async function handleMenuSubmit(event) {
    event.preventDefault();
    setMenuSaving(true);
    setNotice("");
    setError("");

    try {
      const validDrafts = menuDrafts.filter(
        (draft) =>
          String(draft.name).trim() ||
          String(draft.price).trim() ||
          draft.image,
      );

      if (validDrafts.length === 0) {
        throw new Error("Add at least one menu item before uploading.");
      }

      const formData = new FormData();
      const itemsPayload = validDrafts.map((draft, index) => {
        if (
          !String(draft.name).trim() ||
          !String(draft.price).trim() ||
          !draft.image
        ) {
          throw new Error(
            "Each menu item must include a name, price, and image.",
          );
        }

        formData.append("images", draft.image);

        return {
          name: draft.name,
          category: draft.category,
          description: draft.description,
          price: draft.price,
          available: draft.available,
          imageIndex: index,
        };
      });

      formData.append("items", JSON.stringify(itemsPayload));

      const response = await fetch(`${API_BASE}/dashboard/menu-items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create menu items.");
      }

      setMenuDrafts([createMenuDraft()]);
      setFileInputSeed((current) => current + 1);
      setNotice(
        `${data.items?.length || validDrafts.length} menu item${
          (data.items?.length || validDrafts.length) > 1 ? "s" : ""
        } uploaded.`,
      );
      onToast(
        `${data.items?.length || validDrafts.length} menu item${
          (data.items?.length || validDrafts.length) > 1 ? "s" : ""
        } uploaded successfully.`,
      );
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setMenuSaving(false);
    }
  }

  async function deleteMenuItem(itemId) {
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/dashboard/menu-items/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Unable to delete menu item.");
      }

      setNotice("Menu item deleted.");
      onToast("Menu item deleted.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    }
  }

  function startEditingMenuItem(item) {
    setEditingItemId(item.id);
    setEditDraft(createEditDraft(item));
    setNotice("");
    setError("");
  }

  function cancelEditingMenuItem() {
    setEditingItemId("");
    setEditDraft(null);
  }

  function updateEditDraft(field, value) {
    setEditDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveEditedMenuItem(itemId) {
    if (!editDraft) {
      return;
    }

    setEditMenuSaving(true);
    setNotice("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", editDraft.name);
      formData.append("category", editDraft.category);
      formData.append("description", editDraft.description);
      formData.append("price", editDraft.price);
      formData.append("available", String(editDraft.available));

      if (editDraft.image) {
        formData.append("image", editDraft.image);
      }

      const response = await fetch(`${API_BASE}/dashboard/menu-items/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update menu item.");
      }

      setNotice("Menu item updated.");
      onToast("Menu item updated.");
      cancelEditingMenuItem();
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setEditMenuSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete this owner account and all menu items permanently?",
    );

    if (!confirmed) {
      return;
    }

    setAccountDeleting(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/dashboard/account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Unable to delete account.");
      }

      onToast("Account deleted successfully.");
      onLogout();
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setAccountDeleting(false);
    }
  }

  function handleLogoutClick() {
    onToast("Logged out successfully.");
    onLogout();
  }

  if (loading) {
    return <StatusScreen>Loading dashboard...</StatusScreen>;
  }

  if (!dashboard) {
    return (
      <StatusScreen error>{error || "Dashboard unavailable."}</StatusScreen>
    );
  }

  return (
    <div className={`${shellClass} overflow-x-hidden`}>
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="wrap-break-word text-3xl font-black text-[#20120e] sm:text-4xl">
            {dashboard.owner.businessName}
          </h2>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <a
            className={`${ghostButtonClass} w-full sm:w-auto`}
            href={dashboard.publicMenuUrl}
            target="_blank"
            rel="noreferrer"
          >
            View Public Menu
          </a>
          <button
            className={`${dangerButtonClass} w-full sm:w-auto`}
            type="button"
            onClick={handleLogoutClick}
          >
            Logout
          </button>
        </div>
      </header>

      {error ? <NoticeBox tone="error">{error}</NoticeBox> : null}
      {notice ? <NoticeBox tone="success">{notice}</NoticeBox> : null}

      <section className="mb-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <article className={panelClass}>
          <div className="mb-5">
            <p className={eyebrowClass}>Business Profile</p>
            <h2 className="text-2xl font-black text-[#20120e]">
              Store details and review section links
            </h2>
          </div>

          <form className="grid gap-4" onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business name">
                <input
                  className={inputClass}
                  name="businessName"
                  value={profileForm.businessName}
                  onChange={updateProfileField}
                  required
                />
              </Field>

              <Field label="Business type">
                <select
                  className={inputClass}
                  name="businessType"
                  value={profileForm.businessType}
                  onChange={updateProfileField}
                >
                  <option value="food-cart">Food Cart</option>
                  <option value="hotel">Hotel</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Phone">
                <input
                  className={inputClass}
                  name="phone"
                  value={profileForm.phone}
                  onChange={updateProfileField}
                />
              </Field>

              <Field label="Address">
                <textarea
                  className={inputClass}
                  name="address"
                  rows="3"
                  value={profileForm.address}
                  onChange={updateProfileField}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className={inputClass}
                name="description"
                rows="4"
                value={profileForm.description}
                onChange={updateProfileField}
              />
            </Field>

            <div className="grid gap-4">
              <div>
                <p className={eyebrowClass}>Review</p>
                <h3 className="text-xl font-bold text-[#20120e]">
                  Social handles and rating links
                </h3>
                <p className="mt-2 text-sm text-[#746157]">
                  Add URLs only for the handles you use. Empty handles stay hidden for users.
                </p>
              </div>

              {profileForm.socialLinks.map((link, index) => (
                <label
                  className="grid gap-3 rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/70 p-4 xl:grid-cols-[auto_12rem_1fr]"
                  key={link.localId}
                >
                  <div className="flex items-center justify-center xl:justify-start">
                    <SocialIcon platform={link.platform} url={link.url} />
                  </div>
                  <div className="grid content-center gap-1">
                    <strong className="text-[#20120e]">{link.platform}</strong>
                    <span className="text-xs text-[#746157]">{link.ctaLabel}</span>
                  </div>
                  <input
                    className={inputClass}
                    placeholder={
                      getSocialPlatformConfigByLabel(link.platform)?.placeholder ||
                      "https://..."
                    }
                    value={link.url}
                    onChange={(event) =>
                      updateSocialLink(index, "url", event.target.value)
                    }
                  />
                </label>
              ))}
            </div>

            <button
              className={`${primaryButtonClass} w-full sm:w-auto`}
              type="submit"
              disabled={profileSaving}
            >
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>

            <button
              className={`${dangerButtonClass} w-full sm:w-auto`}
              type="button"
              disabled={accountDeleting}
              onClick={handleDeleteAccount}
            >
              {accountDeleting ? "Deleting Account..." : "Delete Account"}
            </button>
          </form>
        </article>

        <article className={panelClass}>
          <div className="mb-5">
            <p className={eyebrowClass}>QR Menu</p>
            <h2 className="text-2xl font-black text-[#20120e]">
              Share this QR for this owner only
            </h2>
          </div>

          <div className="grid gap-4">
            <img
              src={dashboard.qrCodeUrl}
              alt="QR for menu"
              className="mx-auto aspect-square w-full max-w-60 rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white p-4 object-contain"
            />
            <a
              className={`${primaryButtonClass} w-full`}
              href={dashboard.qrCodeUrl}
              download
            >
              Download QR
            </a>
            <div className="grid gap-2">
              <p className="m-0 text-sm text-[#746157]">Public menu URL</p>
              <a
                className="break-all text-sm font-medium text-[#20120e] underline decoration-[#d95722]/35 underline-offset-4"
                href={dashboard.publicMenuUrl}
                target="_blank"
                rel="noreferrer"
              >
                {dashboard.publicMenuUrl}
              </a>
            </div>
          </div>
        </article>
      </section>

      <section className={panelClass}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={eyebrowClass}>Menu Items</p>
            <h2 className="text-2xl font-black text-[#20120e]">
              Upload multiple food items for this cart or hotel
            </h2>
          </div>
          <button
            className={`${ghostButtonClass} w-full sm:w-auto`}
            type="button"
            onClick={addMenuDraft}
          >
            Add Another Item
          </button>
        </div>

        <form className="grid gap-4" onSubmit={handleMenuSubmit}>
          <div className="grid gap-4">
            {menuDrafts.map((draft, index) => (
              <article
                className="grid gap-4 rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/72 p-4"
                key={draft.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className={eyebrowClass}>Item {index + 1}</p>
                    <h3 className="text-lg font-bold text-[#20120e]">
                      Menu card details
                    </h3>
                  </div>
                  {menuDrafts.length > 1 ? (
                    <button
                      className={`${dangerButtonClass} w-full sm:w-auto`}
                      type="button"
                      onClick={() => removeMenuDraft(draft.id)}
                    >
                      Remove Item
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Item name">
                    <input
                      className={inputClass}
                      value={draft.name}
                      onChange={(event) =>
                        updateMenuDraft(draft.id, "name", event.target.value)
                      }
                      placeholder="Item name"
                    />
                  </Field>

                  <Field label="Category">
                    <input
                      className={inputClass}
                      list="menu-category-options"
                      value={draft.category}
                      onChange={(event) =>
                        updateMenuDraft(draft.id, "category", event.target.value)
                      }
                      placeholder="Optional: Starters, Main Course, Juices"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Price">
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.price}
                      onChange={(event) =>
                        updateMenuDraft(draft.id, "price", event.target.value)
                      }
                      placeholder="Price"
                    />
                  </Field>
                </div>

                <Field label="Description">
                  <textarea
                    className={inputClass}
                    rows="3"
                    value={draft.description}
                    onChange={(event) =>
                      updateMenuDraft(
                        draft.id,
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Description"
                  />
                </Field>

                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <Field label="Image">
                    <input
                      key={`${draft.id}-${fileInputSeed}`}
                      className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-[#20120e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white`}
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        updateMenuDraft(
                          draft.id,
                          "image",
                          event.target.files?.[0] || null,
                        )
                      }
                    />
                  </Field>

                  <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-[rgba(83,48,34,0.12)] bg-white/60 px-4 py-3">
                    <input
                      className="h-4 w-4 shrink-0 accent-[#d95722]"
                      type="checkbox"
                      checked={draft.available}
                      onChange={(event) =>
                        updateMenuDraft(
                          draft.id,
                          "available",
                          event.target.checked,
                        )
                      }
                    />
                    <span className="text-sm text-[#746157]">
                      Available for public menu
                    </span>
                  </label>
                </div>
              </article>
            ))}
          </div>

          <datalist id="menu-category-options">
            {ownerCategories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>

          <button
            className={`${primaryButtonClass} w-full sm:w-auto`}
            type="submit"
            disabled={menuSaving}
          >
            {menuSaving
              ? "Uploading..."
              : `Upload ${menuDrafts.length} Menu Item${menuDrafts.length > 1 ? "s" : ""}`}
          </button>
        </form>

        <div className="mt-6 grid gap-6">
          {dashboard.menuItems.length > 0 ? (
            groupedDashboardItems.map((group) => (
              <section className="grid gap-4" key={group.id}>
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-[rgba(83,48,34,0.12)]" />
                  <p className="rounded-full bg-[#20120e] px-4 py-2 text-sm font-semibold text-white">
                    {group.category}
                  </p>
                  <span className="h-px flex-1 bg-[rgba(83,48,34,0.12)]" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item) => (
                    <article
                      className="overflow-hidden rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92"
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
                        {editingItemId === item.id && editDraft ? (
                          <>
                            <div className="grid gap-4">
                              <Field label="Item name">
                                <input
                                  className={inputClass}
                                  value={editDraft.name}
                                  onChange={(event) =>
                                    updateEditDraft("name", event.target.value)
                                  }
                                />
                              </Field>
                              <Field label="Category">
                                <input
                                  className={inputClass}
                                  list="menu-category-options"
                                  value={editDraft.category}
                                  onChange={(event) =>
                                    updateEditDraft("category", event.target.value)
                                  }
                                  placeholder="Optional category"
                                />
                              </Field>
                              <Field label="Price">
                                <input
                                  className={inputClass}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editDraft.price}
                                  onChange={(event) =>
                                    updateEditDraft("price", event.target.value)
                                  }
                                />
                              </Field>
                              <Field label="Description">
                                <textarea
                                  className={inputClass}
                                  rows="3"
                                  value={editDraft.description}
                                  onChange={(event) =>
                                    updateEditDraft("description", event.target.value)
                                  }
                                />
                              </Field>
                              <Field label="Replace image">
                                <input
                                  className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-[#20120e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) =>
                                    updateEditDraft(
                                      "image",
                                      event.target.files?.[0] || null,
                                    )
                                  }
                                />
                              </Field>
                              <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-[rgba(83,48,34,0.12)] bg-white/60 px-4 py-3">
                                <input
                                  className="h-4 w-4 shrink-0 accent-[#d95722]"
                                  type="checkbox"
                                  checked={editDraft.available}
                                  onChange={(event) =>
                                    updateEditDraft("available", event.target.checked)
                                  }
                                />
                                <span className="text-sm text-[#746157]">
                                  Available for public menu
                                </span>
                              </label>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <button
                                className={`${primaryButtonClass} w-full sm:w-auto`}
                                type="button"
                                disabled={editMenuSaving}
                                onClick={() => saveEditedMenuItem(item.id)}
                              >
                                {editMenuSaving ? "Saving..." : "Save Changes"}
                              </button>
                              <button
                                className={`${ghostButtonClass} w-full sm:w-auto`}
                                type="button"
                                disabled={editMenuSaving}
                                onClick={cancelEditingMenuItem}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="grid gap-2">
                                <span className="w-fit rounded-full bg-[#d95722]/10 px-3 py-1 text-xs font-semibold text-[#d95722]">
                                  {item.category || "Uncategorized"}
                                </span>
                                <h3 className="text-xl font-bold text-[#20120e]">
                                  {item.name}
                                </h3>
                              </div>
                              <span className="rounded-full bg-[#1f6a5b]/10 px-4 py-3 text-center text-sm font-bold text-[#1f6a5b]">
                                Rs. {Number(item.price).toFixed(2)}
                              </span>
                            </div>
                            <p className="wrap-break-word text-[#746157]">
                              {item.description || ""}
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <span
                                className={`rounded-full px-4 py-3 text-center text-sm font-bold ${
                                  item.available
                                    ? "bg-[#1d7d53]/10 text-[#1d7d53]"
                                    : "bg-[#ad2f2f]/8 text-[#ad2f2f]"
                                }`}
                              >
                                {item.available ? "Visible in QR menu" : "Hidden"}
                              </span>
                              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                                <button
                                  className={`${ghostButtonClass} w-full sm:w-auto`}
                                  type="button"
                                  onClick={() => startEditingMenuItem(item)}
                                >
                                  Edit
                                </button>
                                <button
                                  className={`${dangerButtonClass} w-full sm:w-auto`}
                                  type="button"
                                  onClick={() => deleteMenuItem(item.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 p-4">
              No menu items yet. Upload the first items for this business.
            </div>
          )}
        </div>
      </section>

      <footer className={`${panelClass} mt-5 flex items-center justify-center`}>
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
      const data = await response.json();

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

function PublicMenuPage() {
  const { slug } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const publicCategories = getMenuCategories(payload?.menuItems || []);
  const visibleMenuItems =
    activeCategory === "all"
      ? payload?.menuItems || []
      : (payload?.menuItems || []).filter(
          (item) => String(item.category || "").trim() === activeCategory,
        );

  useEffect(() => {
    async function loadPublicMenu() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE}/public/${slug}`);
        const data = await response.json();

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

  if (loading) {
    return <StatusScreen>Loading menu...</StatusScreen>;
  }

  if (error || !payload) {
    return <StatusScreen error>{error || "Menu not found."}</StatusScreen>;
  }

  return (
    <div className={`${shellClass} overflow-x-hidden`}>
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
          <>
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                  activeCategory === "all"
                    ? "border border-[#20120e] bg-[#20120e] text-white"
                    : "border border-[#20120e]/10 bg-white text-[#20120e] hover:border-[#d95722]/40 hover:text-[#d95722]"
                }`}
                onClick={() => setActiveCategory("all")}
              >
                All
              </button>
              {publicCategories.map((category) => (
                <button
                  key={slugifyCategory(category)}
                  type="button"
                  className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                    activeCategory === category
                      ? "border border-[#20120e] bg-[#20120e] text-white"
                      : "border border-[#20120e]/10 bg-white text-[#20120e] hover:border-[#d95722]/40 hover:text-[#d95722]"
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {visibleMenuItems.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleMenuItems.map((item) => (
              <article
                className="overflow-hidden rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92"
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="grid gap-2">
                      {item.category ? (
                        <span className="w-fit rounded-full bg-[#d95722]/10 px-3 py-1 text-xs font-semibold text-[#d95722]">
                          {item.category}
                        </span>
                      ) : null}
                      <h4 className="text-xl font-bold text-[#20120e]">
                        {item.name}
                      </h4>
                    </div>
                    <span className="rounded-full bg-[#1f6a5b]/10 px-4 py-3 text-center text-sm font-bold text-[#1f6a5b]">
                      Rs. {Number(item.price).toFixed(2)}
                    </span>
                  </div>
                  <p className="wrap-break-word text-[#746157]">
                    {item.description || "No description added."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
            <div className="rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 p-4">
              No menu items are available right now.
            </div>
        )}
      </section>

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

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#746157]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-[#20120e]">{value}</p>
    </article>
  );
}

function DetailPill({ label, value }) {
  return (
    <article className="rounded-2xl border border-[rgba(83,48,34,0.12)] bg-[#fff8f2] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#746157]">
        {label}
      </p>
      <p className="mt-2 wrap-break-word text-sm font-semibold text-[#20120e]">
        {value}
      </p>
    </article>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-[#746157]">{label}</span>
      {children}
    </label>
  );
}

function NoticeBox({ children, tone }) {
  return (
    <section
      className={`mb-4 rounded-3xl border p-4 shadow-[0_26px_70px_rgba(88,45,24,0.08)] ${
        tone === "error"
          ? "border-[#ad2f2f]/15 bg-[rgba(255,251,247,0.96)] text-[#ad2f2f]"
          : "border-[#1d7d53]/15 bg-[rgba(255,251,247,0.96)] text-[#1d7d53]"
      }`}
    >
      {children}
    </section>
  );
}

function ToastViewport({ toasts }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-60 grid w-[min(22rem,calc(100%-2rem))] gap-3">
      {toasts.map((toast) => (
        <section
          key={toast.id}
          className={`rounded-3xl border px-4 py-3 shadow-[0_26px_70px_rgba(88,45,24,0.16)] backdrop-blur-md ${
            toast.tone === "error"
              ? "border-[#ad2f2f]/20 bg-[rgba(255,246,246,0.96)] text-[#ad2f2f]"
              : "border-[#1d7d53]/20 bg-[rgba(247,255,251,0.96)] text-[#1d7d53]"
          }`}
        >
          <p className="text-sm font-semibold">{toast.message}</p>
        </section>
      ))}
    </div>
  );
}

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

function StatusScreen({ children, error = false }) {
  return (
    <div
      className={`grid min-h-screen place-items-center px-4 pt-24 text-center text-lg ${
        error ? "text-[#ad2f2f]" : "text-[#20120e]"
      }`}
    >
      {children}
    </div>
  );
}

export default App;
