import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  API_BASE,
  eyebrowClass,
  inputClass,
  panelClass,
  primaryButtonClass,
  shellClass,
} from "../config/appConfig";
import { Field } from "../components/ui";
import { parseApiResponse } from "../utils/session";
import PasswordResetForm from "./PasswordResetForm";

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

      const data = await parseApiResponse(response);

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

            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default AuthPage;
