export function Notice({ message, tone = "info" }: { message: string; tone?: "info" | "error" | "success" }) {
  const colors = {
    info: "border-[var(--blueprint)] bg-[#eef2ff]",
    error: "border-[var(--danger)] bg-[#fff0f0]",
    success: "border-[var(--mint)] bg-[#edf9f5]"
  };

  return (
    <div
      aria-live="polite"
      className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${colors[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
