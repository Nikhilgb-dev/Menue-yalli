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

export { DetailPill, Field, NoticeBox, StatusScreen, SummaryCard, ToastViewport };
