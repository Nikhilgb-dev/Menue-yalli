import { useState } from "react";
import { API_BASE, inputClass, primaryButtonClass } from "../config/appConfig";
import { Field } from "../components/ui";
import { parseApiResponse } from "../utils/session";

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
      const data = await parseApiResponse(response);

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

export default PasswordResetForm;
