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
      const data = await parseApiResponse(response);

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

export default AdminAuthPage;
